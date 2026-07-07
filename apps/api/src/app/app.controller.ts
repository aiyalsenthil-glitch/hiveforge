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

  @Get('api/workspace')
  getWorkspace(@Req() req: AuthenticatedRequest) {
    return this.appService.getWorkspace(req.workspaceId);
  }

  @Post('api/missions')
  createAndPlanMission(
    @Req() req: AuthenticatedRequest,
    @Body() body: { title: string; description: string; priority?: string }
  ) {
    return this.appService.createAndPlanMission(
      req.workspaceId,
      body.title,
      body.description,
      body.priority
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
}
