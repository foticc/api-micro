import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionAssignRoleMenuReqDto } from './dto/create-permission.dto';
import { ResultData } from '../../common/result/result';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // 赋予角色菜单
  @Post('assign-role-menu')
  assignRoleMenu(@Body() data: PermissionAssignRoleMenuReqDto) {
    return ResultData.success(this.permissionService.assignRoleMenu(data));
  }

  // 获得角色所拥有的菜单编号
  @Get('list-role-resources/:roleId')
  async getMenusPermissionByRoleId(
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    const data =
      await this.permissionService.getMenusPermissionByRoleId(roleId);
    return ResultData.success(data);
  }
  //
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.permissionService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updatePermissionDto: UpdatePermissionDto,
  // ) {
  //   return this.permissionService.update(+id, updatePermissionDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.permissionService.remove(+id);
  // }
}
