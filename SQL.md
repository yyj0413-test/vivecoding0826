-- ============================================================
-- 학부모용 두 자녀 일정·이동 관리 서비스
-- Supabase PostgreSQL schema
--
-- 원칙
-- 1. 기존 테이블/데이터를 삭제하지 않음
-- 2. 예제 데이터 삽입하지 않음
-- 3. 로그인 사용자(auth.uid()) 기준으로 개인 데이터 보호
-- 4. 등원/하원 이동방법을 별도로 저장
-- 5. 기본 이동방법 + 특정 날짜의 예외 설정 지원
-- 6. 부모 이동 경로와 알림 저장 지원
-- ============================================================


-- ------------------------------------------------------------
-- 0. UUID 생성 함수
-- ------------------------------------------------------------

create extension if not exists "pgcrypto";


-- ------------------------------------------------------------
-- 1. 아이 정보
-- ------------------------------------------------------------

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null,
  birth_date date,
  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. 장소
-- 집, 영어학원, 태권도장 등
-- ------------------------------------------------------------

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null,

  address text,

  latitude double precision,
  longitude double precision,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. 일정
--
-- 반복 일정의 기본 정보와 실제 일정 정보를 함께 관리
-- recurring_rule은 향후 반복 일정 확장용
-- ------------------------------------------------------------

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  child_id uuid not null
    references public.children(id)
    on delete cascade,

  title text not null,

  schedule_date date not null,

  start_time time not null,
  end_time time not null,

  place_id uuid
    references public.places(id)
    on delete set null,

  place_name text,

  notes text,

  -- 반복 일정이 아닌 일반 일정은 null
  recurring_rule text,

  is_all_day boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint schedules_time_check
    check (end_time >= start_time)
);


-- ------------------------------------------------------------
-- 4. 일정별 기본 이동방법
--
-- 등원과 하원을 완전히 분리
--
-- arrival_method:
--   parent_drive = 부모가 데려다 줌
--   child_walk   = 아이 혼자 이동
--   academy_bus  = 학원 차량
--
-- departure_method:
--   parent_pickup = 부모가 데리러 감
--   child_walk    = 아이 혼자 이동
--   academy_bus   = 학원 차량
-- ------------------------------------------------------------

create table if not exists public.schedule_transport_defaults (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  schedule_id uuid not null
    references public.schedules(id)
    on delete cascade,

  arrival_method text not null default 'parent_drive',

  departure_method text not null default 'parent_pickup',

  arrival_travel_minutes integer not null default 30,
  departure_travel_minutes integer not null default 30,

  arrival_alert_enabled boolean not null default false,
  departure_alert_enabled boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transport_arrival_method_check
    check (
      arrival_method in (
        'parent_drive',
        'child_walk',
        'academy_bus'
      )
    ),

  constraint transport_departure_method_check
    check (
      departure_method in (
        'parent_pickup',
        'child_walk',
        'academy_bus'
      )
    ),

  constraint transport_arrival_minutes_check
    check (arrival_travel_minutes >= 0),

  constraint transport_departure_minutes_check
    check (departure_travel_minutes >= 0),

  constraint schedule_transport_unique
    unique (schedule_id)
);


-- ------------------------------------------------------------
-- 5. 특정 날짜의 이동방법 변경
--
-- 기본값은 유지하면서 특정 날짜에만 변경할 수 있도록 함
--
-- 예:
-- 기본: 등원 학원차량 / 하원 부모픽업
-- 특정 날짜: 등원 부모차량 / 하원 부모픽업
-- ------------------------------------------------------------

create table if not exists public.schedule_transport_overrides (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  schedule_id uuid not null
    references public.schedules(id)
    on delete cascade,

  override_date date not null,

  arrival_method text,
  departure_method text,

  arrival_travel_minutes integer,
  departure_travel_minutes integer,

  arrival_alert_enabled boolean,
  departure_alert_enabled boolean,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint override_arrival_method_check
    check (
      arrival_method is null
      or arrival_method in (
        'parent_drive',
        'child_walk',
        'academy_bus'
      )
    ),

  constraint override_departure_method_check
    check (
      departure_method is null
      or departure_method in (
        'parent_pickup',
        'child_walk',
        'academy_bus'
      )
    ),

  constraint override_arrival_minutes_check
    check (
      arrival_travel_minutes is null
      or arrival_travel_minutes >= 0
    ),

  constraint override_departure_minutes_check
    check (
      departure_travel_minutes is null
      or departure_travel_minutes >= 0
    ),

  constraint schedule_transport_override_unique
    unique (schedule_id, override_date)
);


-- ------------------------------------------------------------
-- 6. 부모 이동 경로
--
-- 앱이 하루의 부모 이동을 하나의 흐름으로 생성할 때 사용
-- ------------------------------------------------------------

create table if not exists public.parent_routes (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  route_date date not null,

  status text not null default 'draft',

  total_minutes integer not null default 0,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint parent_routes_status_check
    check (
      status in (
        'draft',
        'calculated',
        'confirmed'
      )
    ),

  constraint parent_routes_minutes_check
    check (total_minutes >= 0)
);


-- ------------------------------------------------------------
-- 7. 부모 이동 경로의 구간
--
-- 예:
-- 집 → 첫째 학원
-- 첫째 학원 → 둘째 학원
-- 둘째 학원 → 집
-- ------------------------------------------------------------

create table if not exists public.parent_route_legs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  route_id uuid not null
    references public.parent_routes(id)
    on delete cascade,

  sequence_no integer not null,

  from_place_id uuid
    references public.places(id)
    on delete set null,

  to_place_id uuid
    references public.places(id)
    on delete set null,

  from_place_name text,
  to_place_name text,

  departure_at timestamptz,
  arrival_at timestamptz,

  travel_minutes integer not null default 0,

  related_schedule_id uuid
    references public.schedules(id)
    on delete set null,

  route_type text not null default 'parent_drive',

  created_at timestamptz not null default now(),

  constraint parent_route_leg_sequence_check
    check (sequence_no >= 0),

  constraint parent_route_leg_minutes_check
    check (travel_minutes >= 0),

  constraint parent_route_leg_type_check
    check (
      route_type in (
        'parent_drive',
        'parent_pickup',
        'parent_dropoff'
      )
    )
);


-- ------------------------------------------------------------
-- 8. 픽업 가능 여부 계산 결과
--
-- 앱이 일정과 이동시간을 계산한 결과를 저장
--
-- green  = 여유 있음
-- yellow = 빠듯함
-- red    = 이동시간 부족
-- ------------------------------------------------------------

create table if not exists public.schedule_feasibility (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  route_date date not null,

  from_schedule_id uuid
    references public.schedules(id)
    on delete cascade,

  to_schedule_id uuid
    references public.schedules(id)
    on delete cascade,

  available_minutes integer not null default 0,

  required_minutes integer not null default 0,

  buffer_minutes integer not null default 0,

  status text not null,

  calculated_at timestamptz not null default now(),

  constraint feasibility_status_check
    check (
      status in (
        'green',
        'yellow',
        'red'
      )
    )
);


-- ------------------------------------------------------------
-- 9. 아이별 빈 시간
--
-- 앱에서 자동 계산한 빈 시간 정보를 저장할 수 있도록 함
-- ------------------------------------------------------------

create table if not exists public.child_free_times (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  child_id uuid not null
    references public.children(id)
    on delete cascade,

  free_date date not null,

  start_time time not null,
  end_time time not null,

  duration_minutes integer not null default 0,

  created_at timestamptz not null default now(),

  constraint child_free_time_check
    check (end_time >= start_time),

  constraint child_free_minutes_check
    check (duration_minutes >= 0)
);


-- ------------------------------------------------------------
-- 10. 알림
--
-- 부모 이동 / 아이 출발 / 학원차량 탑승 등에 사용
-- ------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  child_id uuid
    references public.children(id)
    on delete cascade,

  schedule_id uuid
    references public.schedules(id)
    on delete cascade,

  route_id uuid
    references public.parent_routes(id)
    on delete cascade,

  notification_type text not null,

  title text not null,
  message text,

  scheduled_at timestamptz not null,

  is_enabled boolean not null default true,
  is_sent boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_type_check
    check (
      notification_type in (
        'parent_departure',
        'child_departure',
        'academy_bus',
        'pickup',
        'dropoff',
        'route_summary',
        'custom'
      )
    )
);


-- ------------------------------------------------------------
-- 11. 인덱스
-- ------------------------------------------------------------

create index if not exists idx_children_user_id
  on public.children(user_id);

create index if not exists idx_places_user_id
  on public.places(user_id);

create index if not exists idx_schedules_user_date
  on public.schedules(user_id, schedule_date);

create index if not exists idx_schedules_child_date
  on public.schedules(child_id, schedule_date);

create index if not exists idx_schedule_transport_schedule
  on public.schedule_transport_defaults(schedule_id);

create index if not exists idx_transport_override_date
  on public.schedule_transport_overrides(user_id, override_date);

create index if not exists idx_parent_routes_user_date
  on public.parent_routes(user_id, route_date);

create index if not exists idx_parent_route_legs_route
  on public.parent_route_legs(route_id, sequence_no);

create index if not exists idx_feasibility_user_date
  on public.schedule_feasibility(user_id, route_date);

create index if not exists idx_free_times_child_date
  on public.child_free_times(child_id, free_date);

create index if not exists idx_notifications_user_scheduled
  on public.notifications(user_id, scheduled_at);


-- ------------------------------------------------------------
-- 12. updated_at 자동 갱신 함수
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ------------------------------------------------------------
-- 13. updated_at 트리거
-- ------------------------------------------------------------

drop trigger if exists children_set_updated_at
on public.children;

create trigger children_set_updated_at
before update on public.children
for each row
execute function public.set_updated_at();


drop trigger if exists places_set_updated_at
on public.places;

create trigger places_set_updated_at
before update on public.places
for each row
execute function public.set_updated_at();


drop trigger if exists schedules_set_updated_at
on public.schedules;

create trigger schedules_set_updated_at
before update on public.schedules
for each row
execute function public.set_updated_at();


drop trigger if exists schedule_transport_defaults_set_updated_at
on public.schedule_transport_defaults;

create trigger schedule_transport_defaults_set_updated_at
before update on public.schedule_transport_defaults
for each row
execute function public.set_updated_at();


drop trigger if exists schedule_transport_overrides_set_updated_at
on public.schedule_transport_overrides;

create trigger schedule_transport_overrides_set_updated_at
before update on public.schedule_transport_overrides
for each row
execute function public.set_updated_at();


drop trigger if exists parent_routes_set_updated_at
on public.parent_routes;

create trigger parent_routes_set_updated_at
before update on public.parent_routes
for each row
execute function public.set_updated_at();


drop trigger if exists notifications_set_updated_at
on public.notifications;

create trigger notifications_set_updated_at
before update on public.notifications
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 14. RLS 활성화
-- ------------------------------------------------------------

alter table public.children enable row level security;
alter table public.places enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_transport_defaults enable row level security;
alter table public.schedule_transport_overrides enable row level security;
alter table public.parent_routes enable row level security;
alter table public.parent_route_legs enable row level security;
alter table public.schedule_feasibility enable row level security;
alter table public.child_free_times enable row level security;
alter table public.notifications enable row level security;


-- ------------------------------------------------------------
-- 15. RLS 정책
--
-- 정책이 이미 존재하면 새로 만들지 않음.
-- 따라서 이 SQL을 다시 실행해도 정책 중복 오류를 피할 수 있음.
-- ------------------------------------------------------------

do $$
declare
  policy_exists boolean;
begin

  -- ==========================================================
  -- children
  -- ==========================================================

  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'children'
      and policyname = 'children_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy children_select_own
      on public.children
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'children'
      and policyname = 'children_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy children_insert_own
      on public.children
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'children'
      and policyname = 'children_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy children_update_own
      on public.children
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'children'
      and policyname = 'children_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy children_delete_own
      on public.children
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- places
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'places'
      and policyname = 'places_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy places_select_own
      on public.places
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'places'
      and policyname = 'places_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy places_insert_own
      on public.places
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'places'
      and policyname = 'places_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy places_update_own
      on public.places
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'places'
      and policyname = 'places_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy places_delete_own
      on public.places
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- schedules
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'schedules_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedules_select_own
      on public.schedules
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'schedules_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedules_insert_own
      on public.schedules
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'schedules_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedules_update_own
      on public.schedules
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedules'
      and policyname = 'schedules_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedules_delete_own
      on public.schedules
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- schedule_transport_defaults
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_defaults'
      and policyname = 'transport_defaults_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_defaults_select_own
      on public.schedule_transport_defaults
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_defaults'
      and policyname = 'transport_defaults_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_defaults_insert_own
      on public.schedule_transport_defaults
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_defaults'
      and policyname = 'transport_defaults_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_defaults_update_own
      on public.schedule_transport_defaults
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_defaults'
      and policyname = 'transport_defaults_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_defaults_delete_own
      on public.schedule_transport_defaults
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- schedule_transport_overrides
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_overrides'
      and policyname = 'transport_overrides_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_overrides_select_own
      on public.schedule_transport_overrides
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_overrides'
      and policyname = 'transport_overrides_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_overrides_insert_own
      on public.schedule_transport_overrides
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_overrides'
      and policyname = 'transport_overrides_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_overrides_update_own
      on public.schedule_transport_overrides
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_transport_overrides'
      and policyname = 'transport_overrides_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy transport_overrides_delete_own
      on public.schedule_transport_overrides
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- parent_routes
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_routes'
      and policyname = 'parent_routes_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_routes_select_own
      on public.parent_routes
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_routes'
      and policyname = 'parent_routes_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_routes_insert_own
      on public.parent_routes
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_routes'
      and policyname = 'parent_routes_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_routes_update_own
      on public.parent_routes
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_routes'
      and policyname = 'parent_routes_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_routes_delete_own
      on public.parent_routes
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- parent_route_legs
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_route_legs'
      and policyname = 'parent_route_legs_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_route_legs_select_own
      on public.parent_route_legs
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_route_legs'
      and policyname = 'parent_route_legs_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_route_legs_insert_own
      on public.parent_route_legs
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_route_legs'
      and policyname = 'parent_route_legs_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_route_legs_update_own
      on public.parent_route_legs
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_route_legs'
      and policyname = 'parent_route_legs_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy parent_route_legs_delete_own
      on public.parent_route_legs
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- schedule_feasibility
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_feasibility'
      and policyname = 'schedule_feasibility_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedule_feasibility_select_own
      on public.schedule_feasibility
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_feasibility'
      and policyname = 'schedule_feasibility_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedule_feasibility_insert_own
      on public.schedule_feasibility
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_feasibility'
      and policyname = 'schedule_feasibility_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedule_feasibility_update_own
      on public.schedule_feasibility
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'schedule_feasibility'
      and policyname = 'schedule_feasibility_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy schedule_feasibility_delete_own
      on public.schedule_feasibility
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- child_free_times
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'child_free_times'
      and policyname = 'child_free_times_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy child_free_times_select_own
      on public.child_free_times
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'child_free_times'
      and policyname = 'child_free_times_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy child_free_times_insert_own
      on public.child_free_times
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'child_free_times'
      and policyname = 'child_free_times_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy child_free_times_update_own
      on public.child_free_times
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'child_free_times'
      and policyname = 'child_free_times_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy child_free_times_delete_own
      on public.child_free_times
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;


  -- ==========================================================
  -- notifications
  -- ==========================================================

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) into policy_exists;

  if not policy_exists then
    create policy notifications_select_own
      on public.notifications
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_insert_own'
  ) into policy_exists;

  if not policy_exists then
    create policy notifications_insert_own
      on public.notifications
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_update_own'
  ) into policy_exists;

  if not policy_exists then
    create policy notifications_update_own
      on public.notifications
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;


  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_delete_own'
  ) into policy_exists;

  if not policy_exists then
    create policy notifications_delete_own
      on public.notifications
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;

end $$;