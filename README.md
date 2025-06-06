# Pokémon Backend API con Redis

Backend desarrollado con NestJS que utiliza Redis para cachear datos de pokémons obtenidos de PokéAPI.

## 🚀 Características

- ✅ **Cache con Redis** - Almacenamiento eficiente de datos
- ✅ **HttpModule de NestJS** - Peticiones HTTP optimizadas  
- ✅ **Búsqueda por prefijo** - Coincidencias parciales desde el inicio del nombre
- ✅ **Inicialización automática** - Carga de datos al iniciar el servidor
- ✅ **Arquitectura modular** - Separación clara de responsabilidades

## 📋 Prerrequisitos

- Node.js (v18 o superior)
- Redis Server (v6 o superior)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
cp .env.example .env

# Iniciar Redis (en otra terminal)
redis-server
✅ 1. Instalar Redis
sudo apt update
sudo apt install redis-server -y

✅ 2. Verificar que Redis se haya instalado
redis-server --version

✅ 3. Habilitar y arrancar el servicio Redis
Esto asegura que Redis se inicie automáticamente al arrancar el sistema:
sudo systemctl enable redis
sudo systemctl start redis

✅ 4. Verificar que Redis esté corriendo
sudo systemctl status redis

# Iniciar la aplicación
npm run start:dev
```

## 🏗️ Estructura de datos en Redis

La implementación utiliza una estructura optimizada:

**Claves principales:**
- `pokemon:list` - Conjunto ordenado (ZSET) con todos los pokémons
- `pokemon:{id}` - Hash individual para cada pokémon

**Ventajas de esta estructura:**
- **Búsquedas eficientes** por prefijo de nombre
- **Acceso rápido** por ID específico  
- **Memoria optimizada** sin duplicación de datos
- **Escalabilidad** para grandes volúmenes de datos

## 📡 Endpoints

- `GET /pokemon/search?name=bulba` - Buscar pokémons por prefijo
- `GET /pokemon/reload` - Recargar datos desde PokéAPI

## 🔄 Flujo de inicialización

1. **Verificación Redis** - Comprueba si existen datos cacheados
2. **Petición PokéAPI** - Solo si no hay datos en cache
3. **Procesamiento** - Extracción de ID desde URLs
4. **Almacenamiento** - Estructura optimizada en Redis
5. **Listo** - API preparada para búsquedas rápidas

## 🎯 Ejemplo de uso

```bash
# Buscar pokémons que empiecen con "char"
curl "http://localhost:3001/pokemon/search?name=char"

# Respuesta:
[
  { "id": 4, "name": "charmander" },
  { "id": 5, "name": "charmeleon" },  
  { "id": 6, "name": "charizard" }
]
```