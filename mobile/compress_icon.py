from PIL import Image
import os

# Abrir imagen
img = Image.open('assets/icon.png')

# Asegurar modo RGB
if img.mode != 'RGB':
    img = img.convert('RGB')

# Guardar optimizado sin pérdida de calidad
img.save('assets/icon.png', 'PNG', optimize=True, compress_level=9)

# Mostrar resultado
size = os.path.getsize('assets/icon.png')
print(f'Imagen restaurada: {int(size/1024)} KB')
print(f'Tamaño: {img.size}')
print(f'Modo: {img.mode}')
