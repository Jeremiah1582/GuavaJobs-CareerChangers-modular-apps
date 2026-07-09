"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const assessments_module_1 = require("./assessments/assessments.module");
const auth_module_1 = require("./auth/auth.module");
const cv_module_1 = require("./cv/cv.module");
const health_module_1 = require("./health/health.module");
const jobs_module_1 = require("./jobs/jobs.module");
const autofill_module_1 = require("./autofill/autofill.module");
const applications_module_1 = require("./applications/applications.module");
const prisma_module_1 = require("./prisma/prisma.module");
const profiles_module_1 = require("./profiles/profiles.module");
const queue_module_1 = require("./queue/queue.module");
const redis_module_1 = require("./redis/redis.module");
const users_module_1 = require("./users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            queue_module_1.QueueModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            profiles_module_1.ProfilesModule,
            cv_module_1.CvModule,
            assessments_module_1.AssessmentsModule,
            jobs_module_1.JobsModule,
            applications_module_1.ApplicationsModule,
            autofill_module_1.AutofillModule,
            health_module_1.HealthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map