'use client';

import type { ComponentProps } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type UserAvatarProps = ComponentProps<typeof Avatar> & {
  name: string;
  imageUrl?: string | null;
};

export function userInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/** Picture or initial, with the full name in a tooltip. */
export function UserAvatar({ name, imageUrl, ...props }: UserAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Avatar {...props} />}>
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback>{userInitial(name)}</AvatarFallback>
        <span className="sr-only">{name}</span>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
