import { Globe2Icon, LinkIcon, LockIcon, type LucideIcon, UserLockIcon, UsersIcon } from "lucide-react";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";

export interface VisibilityOption {
  value: Visibility;
  /** Proto enum name, as stored in user settings and sent in filter expressions. */
  name: "PRIVATE" | "SPACE" | "PROTECTED" | "PUBLIC" | "UNLISTED";
  labelKey:
    | "memo.visibility.private"
    | "memo.visibility.space"
    | "memo.visibility.protected"
    | "memo.visibility.public"
    | "memo.visibility.unlisted";
  descriptionKey:
    | "memo.visibility.private-description"
    | "memo.visibility.space-description"
    | "memo.visibility.protected-description"
    | "memo.visibility.public-description"
    | "memo.visibility.unlisted-description";
  icon: LucideIcon;
  /** SPACE only means anything inside a Space, so it is offered contextually rather than as a standing choice. */
  requiresSpace: boolean;
  /** PUBLIC is offered only when the instance is accessible to anonymous visitors. */
  requiresPublicSite: boolean;
}

/**
 * The single source of truth for how each audience is named, described and drawn.
 * Ordered by widening audience. Every visibility surface derives from this, so a new
 * enum value is added here once instead of in each picker, icon map and converter.
 */
export const VISIBILITY_OPTIONS: readonly VisibilityOption[] = [
  {
    value: Visibility.PRIVATE,
    name: "PRIVATE",
    labelKey: "memo.visibility.private",
    descriptionKey: "memo.visibility.private-description",
    icon: LockIcon,
    requiresSpace: false,
    requiresPublicSite: false,
  },
  {
    value: Visibility.SPACE,
    name: "SPACE",
    labelKey: "memo.visibility.space",
    descriptionKey: "memo.visibility.space-description",
    icon: UserLockIcon,
    requiresSpace: true,
    requiresPublicSite: false,
  },
  {
    value: Visibility.PUBLIC,
    name: "PUBLIC",
    labelKey: "memo.visibility.public",
    descriptionKey: "memo.visibility.public-description",
    icon: Globe2Icon,
    requiresSpace: false,
    requiresPublicSite: true,
  },
  {
    value: Visibility.UNLISTED,
    name: "UNLISTED",
    labelKey: "memo.visibility.unlisted",
    descriptionKey: "memo.visibility.unlisted-description",
    icon: LinkIcon,
    requiresSpace: false,
    requiresPublicSite: false,
  },
  {
    value: Visibility.PROTECTED,
    name: "PROTECTED",
    labelKey: "memo.visibility.protected",
    descriptionKey: "memo.visibility.protected-description",
    icon: UsersIcon,
    requiresSpace: false,
    requiresPublicSite: false,
  },
];

export const getVisibilityOption = (visibility: Visibility): VisibilityOption | undefined =>
  VISIBILITY_OPTIONS.find((option) => option.value === visibility);

/**
 * Audiences a memo can be set to. SPACE is offered when the memo is placed in a
 * Space, and also when a legacy/inconsistent memo already uses it so the control
 * can still name its current audience instead of silently downgrading it.
 */
export const getAssignableVisibilityOptions = (options: {
  hasSpacePlacement: boolean;
  allowPublic: boolean;
  current?: Visibility;
}): VisibilityOption[] =>
  VISIBILITY_OPTIONS.filter(
    (option) =>
      ((!option.requiresSpace || options.hasSpacePlacement) && (!option.requiresPublicSite || options.allowPublic)) ||
      option.value === options.current,
  );

/** Audiences offered as a persistent default. A Space-scoped default has no meaning outside a Space. */
export const DEFAULT_VISIBILITY_OPTIONS: readonly VisibilityOption[] = VISIBILITY_OPTIONS.filter((option) => !option.requiresSpace);

export const convertVisibilityFromString = (visibility: string) =>
  VISIBILITY_OPTIONS.find((option) => option.name === visibility)?.value ?? Visibility.PUBLIC;

export const convertVisibilityToString = (visibility: Visibility) => getVisibilityOption(visibility)?.name ?? "PRIVATE";
