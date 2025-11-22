import type { HTMLAttributes, PropsWithChildren } from 'react';

export type ModuleProps = PropsWithChildren & HTMLAttributes<HTMLDivElement>;
export function Module({ style, className, children, ...props }: ModuleProps) {
  return (
    <div
      className={'flex flex-col bg-highlight rounded ' + (className ?? '')}
      style={{
        padding: 16,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
