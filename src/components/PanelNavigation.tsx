import NavButton from "./NavButton";

interface ButtonConfig {
  href: string;
  show?: boolean;
  onClick?: () => Promise<boolean | void> | boolean | void;
}

interface PanelNavigationProps {
  back?: ButtonConfig;
  next?: ButtonConfig;
  submit?: ButtonConfig;
}

export default function PanelNavigation({ back, next, submit }: PanelNavigationProps) {
  const showBack = back && back.show !== false;
  const showNext = next && next.show !== false;
  const showSubmit = submit && submit.show !== false;

  return (
    <nav className="mt-auto flex items-center justify-between px-6 py-4 border-t border-white/20">
      <div className="flex-1 flex justify-start">
        {showBack && <NavButton type="back" label="Back" href={back!.href} onClick={back!.onClick} />}
      </div>
      <div className="flex-1 flex justify-center">
        {showSubmit && <NavButton type="submit" label="Submit" href={submit!.href} onClick={submit!.onClick} />}
      </div>
      <div className="flex-1 flex justify-end">
        {showNext && <NavButton type="next" label="Next" href={next!.href} onClick={next!.onClick} />}
      </div>
    </nav>
  );
}
