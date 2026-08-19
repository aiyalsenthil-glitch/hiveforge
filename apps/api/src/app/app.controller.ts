import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticatedRequest } from './common/middleware/demo-auth.middleware';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('api/auth/sign-in')
  signIn(@Body() body: { email: string; isNewUser?: boolean }) {
    return this.appService.signInUser(body.email, body.isNewUser);
  }

  @Get('api/workspace')
  getWorkspace(@Req() req: AuthenticatedRequest) {
    return this.appService.getWorkspace(req.workspaceId);
  }

  @Post('api/missions')
  createAndPlanMission(
    @Req() req: AuthenticatedRequest,
    @Body() body: { title: string; description: string; priority?: string; settings?: any }
  ) {
    return this.appService.createAndPlanMission(
      req.workspaceId,
      body.title,
      body.description,
      body.priority,
      body.settings
    );
  }

  @Post('api/missions/:id/run')
  runMission(@Param('id') id: string) {
    return this.appService.runMission(id);
  }

  @Get('api/missions')
  listMissions(@Req() req: AuthenticatedRequest) {
    return this.appService.listMissions(req.workspaceId);
  }

  @Get('api/missions/:id')
  getMission(@Param('id') id: string) {
    return this.appService.getMission(id);
  }

  @Get('api/activities')
  getLatestActivities(@Req() req: AuthenticatedRequest) {
    return this.appService.getLatestActivities(req.workspaceId);
  }

  @Get('api/products')
  listProducts(@Req() req: AuthenticatedRequest) {
    return this.appService.listProducts(req.workspaceId);
  }

  @Post('api/products')
  createProduct(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string; category: string; costPrice: number; sellingPrice: number; stock: number; minStockLevel?: number; sku?: string; barcode?: string }
  ) {
    return this.appService.createProduct(req.workspaceId, body);
  }

  @Post('api/sales/checkout')
  processCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() body: { items: any[]; subtotal: number; discount: number; tax: number; totalAmount: number; paymentMethod: string; customerName?: string; customerPhone?: string }
  ) {
    return this.appService.processCheckout(req.workspaceId, body);
  }

  @Get('api/sales')
  getSalesSummary(@Req() req: AuthenticatedRequest) {
    return this.appService.getSalesSummary(req.workspaceId);
  }
}
