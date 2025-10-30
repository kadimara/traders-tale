import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

export const basePath = '/traders-tale/';

type RouterProps = {
  path?: string;
  element?: ReactNode | undefined;
  children?: ReactNode | undefined;
};

export function Router({ path, element, children }: RouterProps) {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname.replace(basePath, '')
  );

  const paths = useMemo(() => {
    return recursivePaths(children);
  }, [children]);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname.replace(basePath, ''));
    };
    window.addEventListener('navigate', onLocationChange);
    return () => window.removeEventListener('navigate', onLocationChange);
  }, []);

  if (path === undefined && paths?.includes(currentPath)) {
    return children;
  }

  return currentPath === path ? element : null;
}

export const Link = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode | undefined;
}) => {
  const preventReload = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={preventReload}>
      {children}
    </a>
  );
};

export function navigate(to: string) {
  window.history.pushState({}, '', basePath + to);
  const navigationEvent = new PopStateEvent('navigate');
  window.dispatchEvent(navigationEvent);
}

function recursivePaths(children: ReactNode): (string | undefined)[] {
  const childrenArray = Children.toArray(children);
  return childrenArray.flatMap((child) => {
    if (isValidElement(child)) {
      if (child.type === Router) {
        return [(child.props as RouterProps).path];
      } else {
        return recursivePaths((child.props as PropsWithChildren).children);
      }
    }
    return [];
  });
}
