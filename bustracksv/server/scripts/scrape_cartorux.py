#!/usr/bin/env python3
"""
Script de Scraping Ético para Cartorux.com
Basado en el Informe Técnico: Arquitectura de Datos y Estrategia de Implementación

Fase 1: Rastreo (Crawling)
Fase 2: Procesamiento de Lenguaje Natural (NLP) Ligero

Autor: Ingeniero de Datos Senior
Fecha: 2024
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
import logging
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, asdict
from datetime import datetime
import sys
import os

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cartorux_scraping.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

BASE_URL = "https://cartorux.com"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
REQUEST_DELAY = 2  # Segundos entre peticiones (scraping ético)
TIMEOUT = 30  # Timeout para peticiones HTTP
MIN_CONTENT_LENGTH = 100  # Mínimo de caracteres para considerar contenido válido (Sección 3.3)

# Frases de error que indican páginas "cascarón" (Sección 3.3)
ERROR_PHRASES = [
    "unavailable in the document",
    "not found",
    "error",
    "página no encontrada",
    "contenido no disponible"
]

# Los 14 departamentos de El Salvador (Sección 2.1)
DEPARTMENTS = [
    {"name": "Ahuachapán", "slug": "ahuachapan"},
    {"name": "Cabañas", "slug": "cabanas"},
    {"name": "Chalatenango", "slug": "chalatenango"},
    {"name": "Cuscatlán", "slug": "cuscatlan"},
    {"name": "La Libertad", "slug": "la-libertad"},
    {"name": "La Paz", "slug": "la-paz"},
    {"name": "La Unión", "slug": "la-union"},
    {"name": "Morazán", "slug": "morazan"},
    {"name": "San Miguel", "slug": "san-miguel"},
    {"name": "San Salvador", "slug": "san-salvador"},
    {"name": "San Vicente", "slug": "san-vicente"},
    {"name": "Santa Ana", "slug": "santa-ana"},
    {"name": "Sonsonate", "slug": "sonsonate"},
    {"name": "Usulután", "slug": "usulutan"}
]

# ============================================================================
# EXPRESIONES REGULARES (Sección 4.2)
# ============================================================================

# Regex para precios (ej. "$1.50", "$0.35")
PRICE_REGEX = re.compile(r'\$(\d+\.?\d*)', re.IGNORECASE)

# Regex para horarios (ej. "6:00am", "7:00pm", "06:00 a.m.")
TIME_REGEX = re.compile(r'(\d{1,2}):(\d{2})\s?(am|pm|a\.m\.|p\.m\.)', re.IGNORECASE)

# Regex para identificadores de ruta (ej. "Ruta 102", "Route 107", "Ruta 177")
ROUTE_REGEX = re.compile(r'(?:Ruta|Route)\s*(\d+[A-Z]?)', re.IGNORECASE)

# Regex para frecuencia (ej. "cada veinte minutos", "cada 20 minutos")
FREQUENCY_REGEX = re.compile(r'cada\s+(\d+)\s+minutos?', re.IGNORECASE)

# Regex para detectar múltiples rutas en un texto
MULTIPLE_ROUTES_REGEX = re.compile(r'(?:Ruta|Route)\s*(\d+[A-Z]?)(?:\s*(?:,|o|y)\s*(?:Ruta|Route)?\s*(\d+[A-Z]?))*', re.IGNORECASE)

# ============================================================================
# CLASES DE DATOS
# ============================================================================

@dataclass
class RouteData:
    """Estructura de datos para una ruta extraída"""
    public_id: str
    department_slug: str
    origin_text: Optional[str] = None
    destination_text: Optional[str] = None
    base_fare: Optional[float] = None
    currency: str = "USD"
    schedule_start: Optional[str] = None
    schedule_end: Optional[str] = None
    frequency_min: Optional[int] = None
    vehicle_type: str = "Bus"
    raw_content: Optional[str] = None
    source_url: Optional[str] = None
    content_quality_score: int = 5
    is_validated: bool = False

@dataclass
class DestinationData:
    """Estructura de datos para un destino extraído"""
    name: str
    slug: str
    category: str
    department_slug: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    raw_content: Optional[str] = None
    content_quality_score: int = 5
    is_validated: bool = False

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

def create_session() -> requests.Session:
    """Crea una sesión HTTP con headers apropiados"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    })
    return session

def fetch_page(session: requests.Session, url: str) -> Optional[BeautifulSoup]:
    """
    Obtiene una página web con manejo de errores y respeto a tiempos de espera
    
    Args:
        session: Sesión HTTP
        url: URL a obtener
        
    Returns:
        BeautifulSoup object o None si hay error
    """
    try:
        logger.info(f"Obteniendo: {url}")
        response = session.get(url, timeout=TIMEOUT)
        response.raise_for_status()
        
        # Respetar tiempos de espera entre peticiones
        time.sleep(REQUEST_DELAY)
        
        return BeautifulSoup(response.content, 'html.parser')
    except requests.exceptions.RequestException as e:
        logger.error(f"Error al obtener {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Error inesperado al procesar {url}: {e}")
        return None

def validate_content(content: str) -> Tuple[bool, int]:
    """
    Valida la calidad del contenido (Sección 3.3)
    Detecta páginas "cascarón" (stubs) y contenido insuficiente
    
    Args:
        content: Contenido de texto a validar
        
    Returns:
        Tuple (is_valid, quality_score)
    """
    if not content or len(content) < MIN_CONTENT_LENGTH:
        return False, 1
    
    # Verificar frases de error
    content_lower = content.lower()
    for phrase in ERROR_PHRASES:
        if phrase.lower() in content_lower:
            return False, 2
    
    # Calcular score basado en longitud
    if len(content) < 500:
        return True, 5
    else:
        return True, 8

def extract_text_from_element(soup: BeautifulSoup, selector: str = 'div.entry-content') -> str:
    """
    Extrae el texto principal de una página
    
    Args:
        soup: BeautifulSoup object
        selector: Selector CSS para el contenedor de contenido
        
    Returns:
        Texto extraído
    """
    content_div = soup.select_one(selector)
    if content_div:
        # Remover scripts y estilos
        for script in content_div(["script", "style"]):
            script.decompose()
        return content_div.get_text(separator=' ', strip=True)
    return ""

# ============================================================================
# FUNCIONES DE EXTRACCIÓN (Sección 4.2)
# ============================================================================

def extract_prices(text: str) -> List[float]:
    """
    Extrae precios del texto usando regex
    
    Args:
        text: Texto a analizar
        
    Returns:
        Lista de precios encontrados
    """
    prices = []
    matches = PRICE_REGEX.findall(text)
    for match in matches:
        try:
            price = float(match)
            prices.append(price)
        except ValueError:
            continue
    return prices

def extract_times(text: str) -> List[str]:
    """
    Extrae horarios del texto usando regex
    
    Args:
        text: Texto a analizar
        
    Returns:
        Lista de horarios en formato HH:MM
    """
    times = []
    matches = TIME_REGEX.findall(text)
    for hour, minute, period in matches:
        try:
            hour = int(hour)
            minute = int(minute)
            
            # Convertir a formato 24 horas
            if period.lower() in ['pm', 'p.m.'] and hour != 12:
                hour += 12
            elif period.lower() in ['am', 'a.m.'] and hour == 12:
                hour = 0
            
            time_str = f"{hour:02d}:{minute:02d}"
            times.append(time_str)
        except ValueError:
            continue
    return times

def extract_route_ids(text: str) -> List[str]:
    """
    Extrae identificadores de ruta del texto
    
    Args:
        text: Texto a analizar
        
    Returns:
        Lista de IDs de ruta encontrados
    """
    route_ids = []
    matches = ROUTE_REGEX.findall(text)
    route_ids.extend(matches)
    
    # También buscar múltiples rutas en una frase (ej. "Rutas 102, 107 o 177")
    multi_matches = MULTIPLE_ROUTES_REGEX.findall(text)
    for match in multi_matches:
        if isinstance(match, tuple):
            route_ids.extend([r for r in match if r])
        else:
            route_ids.append(match)
    
    # Remover duplicados y ordenar
    return sorted(list(set(route_ids)))

def extract_frequency(text: str) -> Optional[int]:
    """
    Extrae frecuencia en minutos del texto
    
    Args:
        text: Texto a analizar
        
    Returns:
        Frecuencia en minutos o None
    """
    match = FREQUENCY_REGEX.search(text)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            pass
    return None

def extract_vehicle_type(text: str) -> str:
    """
    Infiere el tipo de vehículo del texto
    
    Args:
        text: Texto a analizar
        
    Returns:
        "Bus" o "Microbus"
    """
    text_lower = text.lower()
    if "microbus" in text_lower or "microbús" in text_lower or "micro" in text_lower:
        return "Microbus"
    return "Bus"

# ============================================================================
# FUNCIONES DE NAVEGACIÓN (Fase 1: Crawling)
# ============================================================================

def get_department_routes_url(department_slug: str) -> str:
    """
    Construye la URL para la página de rutas de un departamento
    
    Args:
        department_slug: Slug del departamento
        
    Returns:
        URL completa
    """
    # Basado en el patrón mencionado en el informe: cartorux.com/san-salvador-todas-las-rutas-de-buses/
    return f"{BASE_URL}/{department_slug}-todas-las-rutas-de-buses/"

def find_route_links(soup: BeautifulSoup, base_url: str) -> List[str]:
    """
    Encuentra enlaces a páginas de rutas individuales
    
    Args:
        soup: BeautifulSoup object de la página de listado
        base_url: URL base para resolver enlaces relativos
        
    Returns:
        Lista de URLs de rutas
    """
    links = []
    
    # Buscar en artículos o posts (patrón común en WordPress)
    articles = soup.select('article, div.post, div.entry, a[href*="ruta"]')
    
    for article in articles:
        # Buscar enlaces dentro del artículo
        link_elem = article.find('a', href=True) if article.name != 'a' else article
        if link_elem:
            href = link_elem.get('href', '')
            if href:
                full_url = urljoin(base_url, href)
                if 'ruta' in href.lower() or 'route' in href.lower():
                    links.append(full_url)
    
    return list(set(links))  # Remover duplicados

def find_destination_links(soup: BeautifulSoup, base_url: str) -> List[str]:
    """
    Encuentra enlaces a páginas de destinos turísticos
    
    Args:
        soup: BeautifulSoup object
        base_url: URL base
        
    Returns:
        Lista de URLs de destinos
    """
    links = []
    
    # Buscar enlaces relacionados con turismo
    categories = ['playa', 'museo', 'bosque', 'sitio-arqueologico', 'turicentro']
    
    for category in categories:
        category_links = soup.select(f'a[href*="{category}"]')
        for link in category_links:
            href = link.get('href', '')
            if href:
                full_url = urljoin(base_url, href)
                links.append(full_url)
    
    return list(set(links))

# ============================================================================
# FUNCIONES DE PROCESAMIENTO
# ============================================================================

def process_route_page(soup: BeautifulSoup, url: str, department_slug: str) -> List[RouteData]:
    """
    Procesa una página de ruta individual y extrae datos estructurados
    
    Args:
        soup: BeautifulSoup object de la página
        url: URL de la página
        department_slug: Slug del departamento
        
    Returns:
        Lista de RouteData (puede haber múltiples rutas en una página)
    """
    routes = []
    
    # Extraer contenido de texto
    content = extract_text_from_element(soup)
    
    # Validar contenido
    is_valid, quality_score = validate_content(content)
    if not is_valid:
        logger.warning(f"Contenido inválido o página cascarón detectada: {url}")
        return routes
    
    # Extraer datos
    route_ids = extract_route_ids(content)
    prices = extract_prices(content)
    times = extract_times(content)
    frequency = extract_frequency(content)
    vehicle_type = extract_vehicle_type(content)
    
    # Si no se encontraron rutas, intentar extraer del título
    if not route_ids:
        title = soup.find('title')
        if title:
            title_text = title.get_text()
            route_ids = extract_route_ids(title_text)
    
    # Si aún no hay rutas, crear una entrada genérica
    if not route_ids:
        route_ids = ["UNKNOWN"]
    
    # Extraer origen y destino del texto (heurística simple)
    origin_text = None
    destination_text = None
    
    # Buscar patrones comunes (ej. "desde X hasta Y", "de X a Y")
    origin_pattern = re.search(r'(?:desde|de)\s+([A-Z][^,]+?)(?:\s+(?:hasta|a|hacia))', content, re.IGNORECASE)
    dest_pattern = re.search(r'(?:hasta|a|hacia)\s+([A-Z][^,\.]+?)(?:\.|,|$)', content, re.IGNORECASE)
    
    if origin_pattern:
        origin_text = origin_pattern.group(1).strip()
    if dest_pattern:
        destination_text = dest_pattern.group(1).strip()
    
    # Crear una entrada por cada ruta encontrada
    for route_id in route_ids:
        route = RouteData(
            public_id=route_id,
            department_slug=department_slug,
            origin_text=origin_text,
            destination_text=destination_text,
            base_fare=prices[0] if prices else None,
            schedule_start=times[0] if times else None,
            schedule_end=times[-1] if len(times) > 1 else None,
            frequency_min=frequency,
            vehicle_type=vehicle_type,
            raw_content=content,
            source_url=url,
            content_quality_score=quality_score,
            is_validated=is_valid
        )
        routes.append(route)
    
    return routes

def process_destination_page(soup: BeautifulSoup, url: str) -> Optional[DestinationData]:
    """
    Procesa una página de destino turístico
    
    Args:
        soup: BeautifulSoup object
        url: URL de la página
        
    Returns:
        DestinationData o None si es inválido
    """
    # Extraer contenido
    content = extract_text_from_element(soup)
    
    # Validar contenido
    is_valid, quality_score = validate_content(content)
    if not is_valid:
        logger.warning(f"Destino inválido o página cascarón: {url}")
        return None
    
    # Extraer título
    title_elem = soup.find('h1') or soup.find('title')
    name = title_elem.get_text().strip() if title_elem else "Unknown"
    
    # Inferir categoría de la URL o contenido
    category = "Otro"
    url_lower = url.lower()
    content_lower = content.lower()
    
    if "playa" in url_lower or "playa" in content_lower:
        category = "Playa"
    elif "museo" in url_lower or "museo" in content_lower:
        category = "Museo"
    elif "bosque" in url_lower or "bosque" in content_lower:
        category = "Bosque"
    elif "arqueologico" in url_lower or "arqueológico" in url_lower:
        category = "Sitio Arqueológico"
    elif "turicentro" in url_lower:
        category = "Turicentro"
    
    # Crear slug desde el nombre
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    
    destination = DestinationData(
        name=name,
        slug=slug,
        category=category,
        description=content[:500] if len(content) > 500 else content,  # Primeros 500 caracteres
        source_url=url,
        raw_content=content,
        content_quality_score=quality_score,
        is_validated=is_valid
    )
    
    return destination

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def scrape_cartorux(output_file: str = "cartorux_data.json"):
    """
    Función principal que orquesta el scraping completo
    
    Args:
        output_file: Archivo JSON de salida
    """
    logger.info("=" * 80)
    logger.info("INICIANDO SCRAPING DE CARTORUX.COM")
    logger.info("=" * 80)
    
    session = create_session()
    all_routes = []
    all_destinations = []
    
    # Iterar sobre departamentos (Sección 2.1)
    for dept in DEPARTMENTS:
        logger.info(f"\n{'='*80}")
        logger.info(f"Procesando departamento: {dept['name']} ({dept['slug']})")
        logger.info(f"{'='*80}")
        
        # Obtener página de listado de rutas del departamento
        routes_url = get_department_routes_url(dept['slug'])
        soup = fetch_page(session, routes_url)
        
        if not soup:
            logger.warning(f"No se pudo obtener la página de rutas para {dept['name']}")
            continue
        
        # Encontrar enlaces a rutas individuales
        route_links = find_route_links(soup, routes_url)
        logger.info(f"Encontradas {len(route_links)} rutas en {dept['name']}")
        
        # Procesar cada ruta
        for route_url in route_links:
            route_soup = fetch_page(session, route_url)
            if route_soup:
                routes = process_route_page(route_soup, route_url, dept['slug'])
                all_routes.extend(routes)
                logger.info(f"  ✓ Procesada: {route_url} ({len(routes)} rutas extraídas)")
            else:
                logger.warning(f"  ✗ Error al procesar: {route_url}")
        
        # Buscar destinos turísticos (opcional, puede estar en otra sección)
        # Esto es una implementación básica; puede necesitar ajustes según la estructura real del sitio
    
    # Procesar destinos turísticos (si hay una sección dedicada)
    logger.info(f"\n{'='*80}")
    logger.info("Procesando destinos turísticos")
    logger.info(f"{'='*80}")
    
    # Intentar acceder a secciones de turismo
    tourism_categories = ['playas', 'museos', 'bosques', 'sitios-arqueologicos']
    for category in tourism_categories:
        category_url = f"{BASE_URL}/{category}/"
        soup = fetch_page(session, category_url)
        
        if soup:
            dest_links = find_destination_links(soup, category_url)
            logger.info(f"Encontrados {len(dest_links)} destinos en categoría: {category}")
            
            for dest_url in dest_links:
                dest_soup = fetch_page(session, dest_url)
                if dest_soup:
                    destination = process_destination_page(dest_soup, dest_url)
                    if destination:
                        destination.category = category.title()
                        all_destinations.append(destination)
                        logger.info(f"  ✓ Procesado: {dest_url}")
    
    # Preparar datos para JSON
    output_data = {
        "metadata": {
            "scraping_date": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "total_routes": len(all_routes),
            "total_destinations": len(all_destinations)
        },
        "routes": [asdict(route) for route in all_routes],
        "destinations": [asdict(dest) for dest in all_destinations]
    }
    
    # Guardar a JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"\n{'='*80}")
    logger.info("SCRAPING COMPLETADO")
    logger.info(f"{'='*80}")
    logger.info(f"Total de rutas extraídas: {len(all_routes)}")
    logger.info(f"Total de destinos extraídos: {len(all_destinations)}")
    logger.info(f"Datos guardados en: {output_file}")
    
    return output_data

# ============================================================================
# PUNTO DE ENTRADA
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Scraper ético de cartorux.com')
    parser.add_argument(
        '--output',
        '-o',
        default='cartorux_data.json',
        help='Archivo JSON de salida (default: cartorux_data.json)'
    )
    parser.add_argument(
        '--delay',
        '-d',
        type=int,
        default=REQUEST_DELAY,
        help=f'Tiempo de espera entre peticiones en segundos (default: {REQUEST_DELAY})'
    )
    
    args = parser.parse_args()
    
    # Actualizar delay si se especifica
    if args.delay != REQUEST_DELAY:
        REQUEST_DELAY = args.delay
        logger.info(f"Tiempo de espera configurado: {REQUEST_DELAY} segundos")
    
    try:
        scrape_cartorux(args.output)
    except KeyboardInterrupt:
        logger.info("\nScraping interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error fatal: {e}", exc_info=True)
        sys.exit(1)


