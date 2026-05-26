import { Module } from '@nestjs/common';
import { GrindOptionsService } from './grind-options.service';
import { GrindOptionsController } from './grind-options.controller';

@Module({
  controllers: [GrindOptionsController],
  providers: [GrindOptionsService],
  exports: [GrindOptionsService],
})
export class GrindOptionsModule {}
