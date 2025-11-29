import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { ConfigModule } from '@nestjs/config';
import { GeminiModule } from './services/gemini.module';



@Module({
  imports: [AgentsModule, ConfigModule.forRoot({ isGlobal: true }), GeminiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
