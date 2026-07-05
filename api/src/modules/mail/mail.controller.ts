import {
  Controller, Get, Post, Delete, Patch,
  Param, Body, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailAccountService } from './mail-account.service';
import { MailSyncService } from './mail-sync.service';
import { MailImapService } from './mail-imap.service';
import { MailSmtpService } from './mail-smtp.service';
import { SendMessageDto } from './dto/send-message.dto';
import type { Response } from 'express';

@ApiTags('Mail')
export class MailController {
  constructor(
    private readonly accountService: MailAccountService,
    private readonly syncService: MailSyncService,
    private readonly imapService: MailImapService,
    private readonly smtpService: MailSmtpService,
    private readonly prisma: PrismaService,
  ) {}

  // ── OAuth — NOT guarded (callback comes from Google/Microsoft redirect) ─────

  @Get('auth/google/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  getGoogleUrl(@Req() req: any) {
    return { url: this.accountService.getGoogleAuthUrl(BigInt(req.user.id)) };
  }

  @Get('auth/microsoft/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  getMicrosoftUrl(@Req() req: any) {
    return { url: this.accountService.getMicrosoftAuthUrl(BigInt(req.user.id)) };
  }

  @Get('auth/google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.accountService.handleGoogleCallback(code, state);
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173';
    res.redirect(`${appUrl}/mail`);
  }

  @Get('auth/microsoft/callback')
  async microsoftCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.accountService.handleMicrosoftCallback(code, state);
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173';
    res.redirect(`${appUrl}/mail`);
  }

  // ── Accounts ─────────────────────────────────────────────────────────────────

  @Get('accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  listAccounts(@Req() req: any) {
    return this.accountService.listAccounts(BigInt(req.user.id));
  }

  @Delete('accounts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  deleteAccount(@Param('id') id: string, @Req() req: any) {
    return this.accountService.deleteAccount(BigInt(id), BigInt(req.user.id));
  }

  // ── Sync ──────────────────────────────────────────────────────────────────────

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  syncAll(@Req() req: any) {
    return this.syncService.syncAllAccounts(BigInt(req.user.id));
  }

  @Post(':accountId/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async syncOne(
    @Param('accountId') accountId: string,
    @Query('folder') folder: string | undefined,
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    return this.syncService.syncAccount(account, folder);
  }

  // ── Headers ───────────────────────────────────────────────────────────────────

  @Get(':accountId/headers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiQuery({ name: 'folder', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listHeaders(
    @Param('accountId') accountId: string,
    @Query('folder') folder: string = 'INBOX',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Req() req: any,
  ) {
    await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const skip = (Number(page) - 1) * Number(limit);
    const data = await this.prisma.mailHeader.findMany({
      where: { accountId: BigInt(accountId), folder },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit),
    });
    return { data };
  }

  // ── Folders ───────────────────────────────────────────────────────────────────

  @Get(':accountId/folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async listFolders(@Param('accountId') accountId: string, @Req() req: any) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    return this.imapService.listFolders(account, accessToken);
  }

  // ── Message body ──────────────────────────────────────────────────────────────

  @Get(':accountId/message/:uid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async getMessage(
    @Param('accountId') accountId: string,
    @Param('uid') uid: string,
    @Query('folder') folder: string = 'INBOX',
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    return this.imapService.fetchBody(account, accessToken, folder, uid);
  }

  // ── Message actions ───────────────────────────────────────────────────────────

  @Patch(':accountId/message/:uid/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async markRead(
    @Param('accountId') accountId: string,
    @Param('uid') uid: string,
    @Query('folder') folder: string = 'INBOX',
    @Query('isRead') isRead: string = 'true',
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    const read = isRead !== 'false';
    await this.imapService.markRead(account, accessToken, folder, uid, read);
    await this.prisma.mailHeader.updateMany({
      where: { accountId: account.id, folder, uid },
      data: { isRead: read },
    }).catch(() => null);
    return { ok: true };
  }

  @Delete(':accountId/message/:uid')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async trashMessage(
    @Param('accountId') accountId: string,
    @Param('uid') uid: string,
    @Query('folder') folder: string = 'INBOX',
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.imapService.trashMessage(account, accessToken, folder, uid);
    return { ok: true };
  }

  // ── Send ──────────────────────────────────────────────────────────────────────

  @Post(':accountId/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async sendMessage(
    @Param('accountId') accountId: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.smtpService.send(account, accessToken, dto);
    return { ok: true };
  }

  @Post(':accountId/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async replyMessage(
    @Param('accountId') accountId: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.smtpService.reply(account, accessToken, dto);
    return { ok: true };
  }

  @Post(':accountId/forward')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  async forwardMessage(
    @Param('accountId') accountId: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.smtpService.forward(account, accessToken, dto);
    return { ok: true };
  }
}
