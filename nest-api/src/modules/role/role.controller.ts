import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { RoleService } from './role.service';

import { ApiTags } from '@nestjs/swagger';
import { TableSearchFilterDto } from '../../common/tableSearchDto';
import { CreateRoleDto } from './dto/create-role.dto';
import { ResultData } from '../../common/result/result';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('角色管理') // 规整到user的swagger tag中
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.roleService.create(createRoleDto);
    return ResultData.success(data);
  }

  @Post('list')
  async findAll(@Body() searchParam: TableSearchFilterDto<CreateRoleDto>) {
    const data = await this.roleService.findAll(searchParam);
    return ResultData.success(data);
  }
  //
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.roleService.findOne(id);
    return ResultData.success(data);
  }

  @Put('update')
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    const data = await this.roleService.update(updateRoleDto);
    return ResultData.success(data);
  }

  @Post('del')
  async remove(@Body() { ids }: { ids: number[] }) {
    const data = await this.roleService.remove(ids);
    return ResultData.success(data);
  }
}
