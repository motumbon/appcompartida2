from PIL import Image
import os

# Abrir imagen
img = Image.open('assets/icon.png')
print(f'Imagen original: {img.size}, modo: {img.mode}')

# Convertir a RGBA primero (para manejar transparencia si existe)
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Crear fondo blanco
background = Image.new('RGB', img.size, (255, 255, 255))

# Si la imagen tiene transparencia, compositar sobre fondo blanco
if img.mode == 'RGBA':
    background.paste(img, mask=img.split()[3])  # Usar canal alfa como máscara
else:
    background.paste(img)

# Guardar en RGB puro
background.save('assets/icon.png', 'PNG', optimize=True)

# Verificar
new_size = os.path.getsize('assets/icon.png')
final_img = Image.open('assets/icon.png')
print(f'Imagen final: {final_img.size}, modo: {final_img.mode}, peso: {int(new_size/1024)} KB')
