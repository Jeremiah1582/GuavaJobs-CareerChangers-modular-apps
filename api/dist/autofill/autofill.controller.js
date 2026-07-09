"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutofillController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const autofill_service_1 = require("./autofill.service");
let AutofillController = class AutofillController {
    autofill;
    constructor(autofill) {
        this.autofill = autofill;
    }
    getPayload(user, id) {
        return this.autofill.getPayload(user.id, id);
    }
};
exports.AutofillController = AutofillController;
__decorate([
    (0, common_1.Get)(':id/autofill-payload'),
    (0, swagger_1.ApiOperation)({
        summary: 'WebView autofill payload — factual fields + ATS field map for on-device inject',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutofillController.prototype, "getPayload", null);
exports.AutofillController = AutofillController = __decorate([
    (0, swagger_1.ApiTags)('applications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [autofill_service_1.AutofillService])
], AutofillController);
//# sourceMappingURL=autofill.controller.js.map