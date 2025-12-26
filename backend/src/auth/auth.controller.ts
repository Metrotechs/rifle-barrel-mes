/**
 * Auth Controller
 * REST endpoints for authentication
 */

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthService, UserPayload } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

interface LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login with username and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }
    const result = await this.authService.login(user);
    return { success: true, ...result };
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: UserPayload }) {
    return req.user;
  }

  /**
   * Get all users (admin only)
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async getUsers() {
    return this.authService.getUsers();
  }

  /**
   * Create user (admin only)
   */
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createUser(@Body() userData: Omit<UserPayload, 'id'>) {
    return this.authService.createUser(userData);
  }

  /**
   * Update user (admin only)
   */
  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(@Param('id') id: string, @Body() updates: Partial<UserPayload>) {
    return this.authService.updateUser(id, updates);
  }

  /**
   * Delete user (admin only)
   */
  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    const result = await this.authService.deleteUser(id);
    return { success: result };
  }
}
