from PIL import Image
import os

# Paths to the images
base_path = r'c:\Users\elsbe\OneDrive\Desktop\bustracksv\client\public'
files = ['icon_route.png', 'icon_time.png', 'icon_monitor.png']

for filename in files:
    file_path = os.path.join(base_path, filename)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue

    try:
        img = Image.open(file_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            # Check if the pixel is white (or very light gray)
            # Adjust threshold as needed. 240 is a safe bet for "white background"
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))  # Make transparent
            # Also check for black background just in case the previous generation WAS black
            # and the user's screenshot was misleading (unlikely, but safe to check?)
            # No, if I remove black too, I might remove parts of the icon if it has black lines (it shouldn't, it's blue).
            # But let's stick to removing white first as that matches the visual evidence.
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(file_path, "PNG")
        print(f"Successfully processed {filename}")

    except Exception as e:
        print(f"Failed to process {filename}: {e}")
