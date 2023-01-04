import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { OrganizationRepository, UserRepository, MemberRepository } from '@novu/dal';
import { MemberStatusEnum } from '@novu/shared';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { GetInviteCommand } from './get-invite.command';

@Injectable({
  scope: Scope.REQUEST,
})
export class GetInvite {
  constructor(
    private organizationRepository: OrganizationRepository,
    private memberRepository: MemberRepository,
    private userRepository: UserRepository
  ) {}

  async execute(command: GetInviteCommand) {
    const member = await this.memberRepository.findByInviteToken(command.token);
    if (!member) throw new ApiException('No invite found');

    const organization = await this.organizationRepository.findById(member._organizationId);
    if (!organization) throw new NotFoundException('Organization not found');

    const invitedMember = member;

    if (invitedMember.memberStatus !== MemberStatusEnum.INVITED) {
      throw new ApiException('Invite token expired');
    }

    if (!invitedMember.invite) throw new NotFoundException(`Invite not found`);

    const user = await this.userRepository.findById(invitedMember.invite._inviterId);
    if (!user) throw new NotFoundException('User not found');

    return {
      inviter: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
      },
      organization: {
        _id: organization._id,
        name: organization.name,
        logo: organization.logo,
      },
      email: member.invite.email,
      _userId: member._userId,
    };
  }
}
