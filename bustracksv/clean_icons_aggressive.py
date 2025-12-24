from PIL import Image
import os

base_path = r'c:\Users\elsbe\OneDrive\Desktop\bustracksv\client\public'
files = ['icon_route.png', 'icon_time.png', 'icon_monitor.png']

for filename in files:
    file_path = os.path.join(base_path, filename)
    if not os.path.exists(file_path):
        continue

    try:
        img = Image.open(file_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # Heuristic: Cyan is low Red, high Green/Blue.
            # White is high Red, high Green, high Blue.
            # Black is low Red, low Green, low Blue.
            
            # Remove White/Light Gray (High Red)
            # Adjust threshold carefully. If the blue has some red component, we might lose it.
            # But "Cyan" usually has very low red.
            if r > 100: 
                new_data.append((255, 255, 255, 0))
            # Remove Black/Dark (Low brightness)
            elif r < 40 and g < 40 and b < 40:
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(file_path, "PNG")
        print(f"Cleaned {filename}")

    except Exception as e:
        print(f"Error {filename}: {e}")
