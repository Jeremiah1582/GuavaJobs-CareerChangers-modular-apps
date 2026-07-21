import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { RedisModule } from '../redis/redis.module';
import { MarketFitController } from './market-fit.controller';
import { MarketFitService } from './market-fit.service';
import { EuroSalaryProvider } from './salary/eurosalary.provider';
import { OnsAsheProvider } from './salary/ons-ashe.provider';
import { SalaryLookupService } from './salary/salary-lookup.service';

@Module({
  imports: [AiModule, RedisModule],
  controllers: [MarketFitController],
  providers: [
    MarketFitService,
    SalaryLookupService,
    OnsAsheProvider,
    EuroSalaryProvider,
  ],
  exports: [MarketFitService],
})
export class MarketFitModule {}
