import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AgentCoordinatorService } from '../agents/agents-coordinator.service';
import * as readline from 'readline';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const coordinator = app.get(AgentCoordinatorService);

  console.log("💬 Multi-Agent Terminal Chat");
  console.log("----------------------------------");

  // Start script with first message
  const first = await coordinator.processUserInput(""); 
  console.log("Agent:", first.message);

  // Setup terminal input listener
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question("You: ", async (input) => {
      const result = await coordinator.processUserInput(input);

      console.log("Agent:", result.message);

      if (result.stop) {
        console.log("❌ Conversation ended for safety.");
        process.exit(0);
      }

      ask();
    });
  };

  ask();
}

bootstrap();
