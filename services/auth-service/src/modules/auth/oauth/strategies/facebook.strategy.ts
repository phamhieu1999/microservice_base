import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { OAuthService } from '../oauth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly oauthService: OAuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID || 'your-facebook-app-id',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'your-facebook-app-secret',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/auth/facebook/callback',
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, name, emails } = profile;
    const user = {
      id,
      email: emails?.[0].value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      accessToken,
    };

    const result = await this.oauthService.handleOAuthCallback('facebook', {
      id,
      email: emails?.[0].value,
      name: { givenName: name?.givenName, familyName: name?.familyName },
    });

    done(null, result);
  }
}

