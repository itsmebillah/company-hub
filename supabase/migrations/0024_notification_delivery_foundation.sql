-- Sprint: Enterprise Push Notification Foundation
-- Extends the existing notifications table with delivery tracking and
-- priority metadata while remaining safe to run multiple times.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'notification_priority'
  ) then
    create type public.notification_priority as enum (
      'normal',
      'high',
      'urgent'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'notification_delivery_status'
  ) then
    create type public.notification_delivery_status as enum (
      'queued',
      'delivered',
      'opened'
    );
  end if;
end
$$;

alter table public.notifications
  add column if not exists priority public.notification_priority,
  add column if not exists delivery_status public.notification_delivery_status,
  add column if not exists delivered_at timestamptz,
  add column if not exists opened_at timestamptz;

update public.notifications
set priority = coalesce(priority, 'normal'::public.notification_priority),
    delivery_status = coalesce(
      delivery_status,
      case
        when is_read then 'opened'::public.notification_delivery_status
        else 'queued'::public.notification_delivery_status
      end
    ),
    delivered_at = coalesce(
      delivered_at,
      case
        when is_read then created_at
        else null
      end
    ),
    opened_at = coalesce(
      opened_at,
      case
        when is_read then created_at
        else null
      end
    );

update public.notifications
set delivered_at = coalesce(delivered_at, opened_at)
where delivery_status = 'opened'::public.notification_delivery_status;

alter table public.notifications
  alter column priority set default 'normal'::public.notification_priority,
  alter column priority set not null,
  alter column delivery_status
    set default 'queued'::public.notification_delivery_status,
  alter column delivery_status set not null;

create index if not exists notifications_priority_idx
  on public.notifications(priority);

create index if not exists notifications_delivery_status_idx
  on public.notifications(delivery_status);
