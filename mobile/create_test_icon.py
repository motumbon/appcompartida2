from PIL import Image, ImageDraw, ImageFont
import os

# Verificar imagen actual
print("=== DIAGNÓSTICO COMPLETO ===\n")
try:
    current = Image.open('assets/icon.png')
    print("1. Imagen actual encontrada:")
    print(f"   - Tamaño: {current.size}")
    print(f"   - Modo: {current.mode}")
    print(f"   - Formato: {current.format}")
    
    # Verificar si es realmente una imagen válida
    current.verify()
    print("   - Verificación: OK ✓")
    
    # Reabrir después de verify
    current = Image.open('assets/icon.png')
    
except Exception as e:
    print(f"   ERROR: {e}")

print("\n2. Creando nuevo ícono desde cero...")

# Crear imagen COMPLETAMENTE NUEVA sin usar la anterior
# Fondo blanco sólido
icon = Image.new('RGB', (1024, 1024), color=(255, 255, 255))
draw = ImageDraw.Draw(icon)

# Dibujar un ícono simple pero reconocible
# Fondo azul (tu color de app)
draw.rectangle([(100, 100), (924, 924)], fill='#3b82f6')

# Dibujar "ATT" grande en el centro
try:
    # Intentar usar fuente del sistema
    font = ImageFont.truetype("arial.ttf", 300)
except:
    # Si no está disponible, usar fuente por defecto
    font = ImageFont.load_default()

# Texto centrado
text = "ATT"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (1024 - text_width) // 2
y = (1024 - text_height) // 2 - 50

draw.text((x, y), text, fill='white', font=font)

# Guardar con máxima compatibilidad
icon.save('assets/icon_new.png', 'PNG', optimize=False, compress_level=6)

print("   - Nuevo ícono creado: icon_new.png")

# Verificar nuevo ícono
new_icon = Image.open('assets/icon_new.png')
print(f"\n3. Verificación nuevo ícono:")
print(f"   - Tamaño: {new_icon.size}")
print(f"   - Modo: {new_icon.mode}")
print(f"   - Formato: {new_icon.format}")
size = os.path.getsize('assets/icon_new.png')
print(f"   - Peso: {size/1024:.2f} KB")

# Intentar arreglar el ícono actual
print("\n4. Intentando reparar ícono actual...")
try:
    old = Image.open('assets/icon.png')
    # Forzar conversión limpia
    if old.mode != 'RGB':
        old = old.convert('RGB')
    
    # Guardar con configuración estándar
    old.save('assets/icon_repaired.png', 'PNG', optimize=False, compress_level=6)
    print("   - Ícono reparado: icon_repaired.png")
except Exception as e:
    print(f"   - Error al reparar: {e}")

print("\n=== RECOMENDACIONES ===")
print("1. Probar con icon_new.png (ícono de prueba simple)")
print("2. O usar icon_repaired.png (tu ícono reparado)")
print("3. Si ninguno funciona, el problema es de configuración de Expo")
