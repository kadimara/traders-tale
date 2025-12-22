import type { HTMLAttributes, PropsWithChildren } from 'react';

export type ModuleProps = PropsWithChildren & HTMLAttributes<HTMLDivElement>;
export function Module({ style, className, children, ...props }: ModuleProps) {
  return (
    <div
      className={'flex bg-highlight rounded ' + (className ?? '')}
      style={{
        padding: 16,
        justifyContent: 'center',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
