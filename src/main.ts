import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);

    // Habilitar CORS
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`🚀 Servidor Pokémon API con Redis corriendo en http://localhost:${port}`);
    logger.log(`📡 Endpoint de búsqueda: http://localhost:${port}/pokemon/search?name=bulba`);

  } catch (error) {
    logger.error('Error iniciando la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();