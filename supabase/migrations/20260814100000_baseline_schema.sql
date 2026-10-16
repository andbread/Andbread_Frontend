


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."create_initial_nbread_records"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  period_start date;
begin
  select n.start_date
  into period_start
  from public.nbread n
  where n.id = new.nbread_id;

  if period_start is null then
    return new;
  end if;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  values (new.nbread_id, new.user_id, period_start, false)
  on conflict (nbread_id, payment_date, user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "private"."create_initial_nbread_records"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sync_nbread_records_on_payment_schedule_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.start_date is null or new.start_date is not distinct from old.start_date then
    return new;
  end if;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select p.nbread_id, p.user_id, new.start_date, false
  from public.participant p
  where p.nbread_id = new.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "private"."sync_nbread_records_on_payment_schedule_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_nbread_period_start"("p_today" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  candidate_month date;
  target_month date;
  max_day integer;
  candidate_date date;
begin
  if p_payment_period = 'month' then
    candidate_month := date_trunc('month', p_today)::date;
  elsif p_payment_period = 'year' then
    if p_payment_month is null then
      raise exception 'payment_month is required for yearly nbread';
    end if;

    candidate_month := make_date(
      extract(year from p_today)::integer,
      p_payment_month,
      1
    );
  else
    raise exception 'Unsupported payment period: %', p_payment_period;
  end if;

  max_day := extract(
    day from (candidate_month + interval '1 month - 1 day')
  )::integer;

  candidate_date := candidate_month + (least(p_payment_day, max_day) - 1);

  if candidate_date <= p_today then
    return candidate_date;
  end if;

  if p_payment_period = 'month' then
    target_month := candidate_month - interval '1 month';
  else
    target_month := candidate_month - interval '1 year';
  end if;

  max_day := extract(
    day from (target_month + interval '1 month - 1 day')
  )::integer;

  return target_month + (least(p_payment_day, max_day) - 1);
end;
$$;


ALTER FUNCTION "public"."calculate_nbread_period_start"("p_today" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_next_nbread_payment_date"("p_payment_date" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  target_month date;
  max_day integer;
begin
  if p_payment_date is null then
    return null;
  end if;

  if p_payment_day is null or p_payment_day < 1 or p_payment_day > 31 then
    raise exception 'Invalid payment day: %', p_payment_day;
  end if;

  if p_payment_period = 'month' then
    target_month := (date_trunc('month', p_payment_date)::date + interval '1 month')::date;
  elsif p_payment_period = 'year' then
    target_month := make_date(
      extract(year from p_payment_date)::integer + 1,
      coalesce(nullif(p_payment_month, 0), extract(month from p_payment_date)::integer),
      1
    );
  else
    raise exception 'Unsupported payment period: %', p_payment_period;
  end if;

  max_day := extract(
    day from (target_month + interval '1 month - 1 day')
  )::integer;

  return target_month + (least(p_payment_day, max_day) - 1);
end;
$$;


ALTER FUNCTION "public"."calculate_next_nbread_payment_date"("p_payment_date" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_from_public"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    
    DELETE FROM public.user WHERE id = OLD.id;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."delete_user_from_public"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_nbread_invite_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- pending 초대만 수락, 거절, 기간 만료 중 하나의 종료 상태로 변경할 수 있다.
  if old.status = 'pending'
     and new.status in ('accepted', 'rejected', 'expired') then
    return new;
  end if;

  raise exception 'INVALID_INVITE_STATUS_TRANSITION';
end;
$$;


ALTER FUNCTION "public"."enforce_nbread_invite_status_transition"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enforce_nbread_invite_status_transition"() IS '초대 상태를 pending에서 accepted, rejected, expired로만 전환하도록 제한';



CREATE OR REPLACE FUNCTION "public"."generate_nbread_records_for_due_group"("p_nbread_id" "uuid", "p_today" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  target_nbread public.nbread%rowtype;
  new_start_date date;
  new_end_date date;
  next_start_date date;
  existing_count integer;
  inserted_count integer;
  participant_count integer;
  final_record_count integer;
begin
  select *
  into target_nbread
  from public.nbread
  where id = p_nbread_id
  for update;

  if not found then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'nbread_not_found',
      'nbread_id', p_nbread_id
    );
  end if;

  if target_nbread.start_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'start_date_is_null',
      'nbread_id', p_nbread_id
    );
  end if;

  if target_nbread.end_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'end_date_is_null',
      'nbread_id', p_nbread_id,
      'start_date', target_nbread.start_date
    );
  end if;

  if target_nbread.end_date >= p_today then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'period_not_ended',
      'nbread_id', target_nbread.id,
      'start_date', target_nbread.start_date,
      'end_date', target_nbread.end_date
    );
  end if;

  new_start_date := target_nbread.end_date + 1;
  next_start_date := public.calculate_next_nbread_payment_date(
    new_start_date,
    target_nbread.payment_period,
    target_nbread.payment_month,
    target_nbread.payment_date
  );
  new_end_date := next_start_date - 1;

  select count(*)
  into existing_count
  from public.nbread_records
  where nbread_id = target_nbread.id
    and payment_date = new_start_date;

  select count(*)
  into participant_count
  from public.participant
  where nbread_id = target_nbread.id;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select participant.nbread_id, participant.user_id, new_start_date, false
  from public.participant
  where participant.nbread_id = target_nbread.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  select count(*)
  into final_record_count
  from public.nbread_records
  where nbread_id = target_nbread.id
    and payment_date = new_start_date;

  update public.nbread
  set start_date = new_start_date,
      end_date = new_end_date
  where id = target_nbread.id;

  return jsonb_build_object(
    'status', 'success',
    'reason',
      case
        when existing_count > 0 and inserted_count > 0 then 'missing_records_created'
        when existing_count > 0 then 'records_already_complete'
        else 'records_created'
      end,
    'nbread_id', target_nbread.id,
    'start_date', new_start_date,
    'end_date', new_end_date,
    'payment_date', new_start_date,
    'participant_count', participant_count,
    'existing_count', existing_count,
    'inserted_count', inserted_count,
    'final_record_count', final_record_count
  );
end;
$$;


ALTER FUNCTION "public"."generate_nbread_records_for_due_group"("p_nbread_id" "uuid", "p_today" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."init_payment_dates"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  period_start date;
  next_period_start date;
begin
  period_start := public.calculate_nbread_period_start(
    current_date,
    new.payment_period,
    new.payment_month,
    new.payment_date
  );

  next_period_start := public.calculate_next_nbread_payment_date(
    period_start,
    new.payment_period,
    new.payment_month,
    new.payment_date
  );

  new.start_date := period_start;
  new.end_date := next_period_start - 1;

  return new;
end;
$$;


ALTER FUNCTION "public"."init_payment_dates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_into_public_users"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    -- 카카오 로그인 처리
    if new.raw_app_meta_data->>'provider' = 'kakao' then
        insert into public.user (
            email,
            name,
            profile_image,
            social_type,
            id,
            tag,
            terms_agreed,
            privacy_agreed
        )
        values (
            new.raw_user_meta_data->>'email',
            coalesce(
                new.raw_user_meta_data->>'name',
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'email',
                '사용자'
            ),
            new.raw_user_meta_data->>'avatar_url',
            'kakao',
            new.id,
            floor(random() * 9000 + 1000),
            false,
            false
        );
    -- 구글 로그인 처리
    elsif new.raw_app_meta_data->>'provider' = 'google' then
        insert into public.user (
            email,
            name,
            profile_image,
            social_type,
            id,
            tag,
            terms_agreed,
            privacy_agreed
        )
        values (
            new.raw_user_meta_data->>'email',
            coalesce(
                new.raw_user_meta_data->>'name',
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'email',
                '사용자'
            ),
            new.raw_user_meta_data->>'avatar_url',
            'google',
            new.id,
            floor(random() * 9000 + 1000),
            false,
            false
        );
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."insert_into_public_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_nbread_invite"("p_invite_token" "text", "p_response" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_invite public.nbread_invite%rowtype;
  v_user_id uuid := auth.uid();
  v_participant_limit integer;
  v_participant_count bigint;
  v_participant_inserted boolean := false;
  v_already_participant boolean := false;
begin
  if p_response not in ('accepted', 'rejected') then
    raise exception 'INVALID_INVITE_RESPONSE';
  end if;

  -- 동일 초대에 대한 동시 응답을 직렬화해 상태 변경을 한 번만 처리한다.
  select *
    into v_invite
    from public.nbread_invite
   where invite_token = p_invite_token
   for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.status = 'accepted' then
    raise exception 'INVITE_ALREADY_ACCEPTED';
  elsif v_invite.status = 'rejected' then
    raise exception 'INVITE_ALREADY_REJECTED';
  elsif v_invite.status = 'expired' then
    raise exception 'INVITE_EXPIRED';
  end if;

  if v_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if v_invite.target_user_id is not null
     and v_user_id <> v_invite.target_user_id then
    raise exception 'INVITE_TARGET_MISMATCH';
  end if;

  if p_response = 'accepted' then
    if v_invite.target_user_id is null then
      -- 링크 초대는 수락 시점의 로그인 사용자를 초대 대상자로 연결한다.
      update public.nbread_invite
         set target_user_id = v_user_id
       where id = v_invite.id;

      v_invite.target_user_id := v_user_id;
    end if;

    select exists (
      select 1
        from public.participant
       where nbread_id = v_invite.nbread_id
         and user_id = v_invite.target_user_id
    )
      into v_already_participant;

    if not v_already_participant then
      -- 서로 다른 초대를 동시에 수락해도 정원 확인과 참여자 생성을 직렬화한다.
      select participant_count
        into v_participant_limit
        from public.nbread
       where id = v_invite.nbread_id
       for update;

      if not found then
        raise exception 'NBREAD_NOT_FOUND';
      end if;

      select count(*)
        into v_participant_count
        from public.participant
       where nbread_id = v_invite.nbread_id;

      if v_participant_count >= v_participant_limit then
        raise exception 'INVITE_EXPIRED';
      end if;

      -- 함수 내부 검증을 통과한 초대 응답만 참여자로 등록한다.
      insert into public.participant (nbread_id, user_id, is_leader)
      values (v_invite.nbread_id, v_invite.target_user_id, false)
      on conflict (nbread_id, user_id) do nothing;

      v_participant_inserted := found;
    end if;
  end if;

  update public.nbread_invite
     set status = p_response
   where id = v_invite.id;

  return jsonb_build_object(
    'invite_id', v_invite.id,
    'nbread_id', v_invite.nbread_id,
    'status', p_response,
    'outcome',
      case
        when p_response = 'rejected' then 'rejected'
        when v_participant_inserted then 'joined'
        else 'already_participant'
      end
  );
end;
$$;


ALTER FUNCTION "public"."respond_to_nbread_invite"("p_invite_token" "text", "p_response" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."respond_to_nbread_invite"("p_invite_token" "text", "p_response" "text") IS '초대 상태와 대상을 검증하고 RLS로 보호된 참여자 생성을 제한적으로 처리';



CREATE OR REPLACE FUNCTION "public"."update_nbread_records"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  INSERT INTO nbread_record (nbread_id, user_id, payment_date, is_paid)
       SELECT n.id, p.user_id, n.next_payment_date, FALSE
       FROM nbread n
       JOIN participant p ON n.id = p.nbread_id
       WHERE n.next_payment_date = CURRENT_DATE;
END;$$;


ALTER FUNCTION "public"."update_nbread_records"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_dates"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    UPDATE nbread
    SET current_payment_date = next_payment_date,  -- 현재 결제일을 기존의 next_payment_date로 변경
        next_payment_date = CASE 
            WHEN payment_period = 'month' THEN 
                make_date(EXTRACT(YEAR FROM current_payment_date + INTERVAL '1 MONTH')::INTEGER,
                          EXTRACT(MONTH FROM current_payment_date + INTERVAL '1 MONTH')::INTEGER,
                          LEAST(payment_date, 
                                EXTRACT(DAY FROM date_trunc('MONTH', current_payment_date + INTERVAL '1 MONTH') 
                                         + INTERVAL '1 MONTH' - INTERVAL '1 DAY')::INTEGER))
            WHEN payment_period = 'year' THEN
                make_date(EXTRACT(YEAR FROM current_payment_date + INTERVAL '1 YEAR')::INTEGER,
                          payment_month,
                          LEAST(payment_date, 
                                EXTRACT(DAY FROM date_trunc('MONTH', make_date(EXTRACT(YEAR FROM current_payment_date + INTERVAL '1 YEAR')::INTEGER, payment_month, 1)) 
                                         + INTERVAL '1 MONTH' - INTERVAL '1 DAY')::INTEGER))
        END
    WHERE next_payment_date = CURRENT_DATE;
END;$$;


ALTER FUNCTION "public"."update_payment_dates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_notification_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_user_notification_settings_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nbread_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "user_name" character varying NOT NULL,
    "user_profile_image" character varying
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."chat_messages" IS '그룹 채팅 메시지 테이블';



CREATE TABLE IF NOT EXISTS "public"."fcm_token" (
    "user_id" "uuid" NOT NULL,
    "fcm_token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL
);


ALTER TABLE "public"."fcm_token" OWNER TO "postgres";


COMMENT ON TABLE "public"."fcm_token" IS '사용자 디바이스별 fcm token 정보';



ALTER TABLE "public"."fcm_token" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fcm_token_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."friend" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id_1" "uuid" NOT NULL,
    "user_id_2" "uuid" NOT NULL,
    CONSTRAINT "friend_not_self" CHECK (("user_id_1" <> "user_id_2"))
);


ALTER TABLE "public"."friend" OWNER TO "postgres";


ALTER TABLE "public"."friend" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."friend_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."friend_request" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "responded_at" timestamp with time zone,
    "sender_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "friend_request_not_self" CHECK (("sender_id" <> "receiver_id")),
    CONSTRAINT "friend_request_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."friend_request" OWNER TO "postgres";


ALTER TABLE "public"."friend_request" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."friend_request_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."nbread" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying NOT NULL,
    "participant_count" integer NOT NULL,
    "amount" integer NOT NULL,
    "payment_date" integer NOT NULL,
    "payment_month" integer,
    "payment_period" character varying NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "end_date" "date",
    "start_date" "date"
);


ALTER TABLE "public"."nbread" OWNER TO "postgres";


COMMENT ON TABLE "public"."nbread" IS '엔빵 테이블';



CREATE TABLE IF NOT EXISTS "public"."nbread_auto_generation_logs" (
    "id" bigint NOT NULL,
    "nbread_id" "uuid",
    "status" "text" NOT NULL,
    "reason" "text",
    "payment_date" "date",
    "next_payment_date" "date",
    "inserted_count" integer DEFAULT 0 NOT NULL,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start_date" "date",
    "end_date" "date",
    CONSTRAINT "nbread_auto_generation_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'skipped'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."nbread_auto_generation_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."nbread_auto_generation_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."nbread_auto_generation_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."nbread_auto_generation_logs_id_seq" OWNED BY "public"."nbread_auto_generation_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."nbread_invite" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_user_id" "uuid",
    "nbread_id" "uuid" NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "invite_token" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    CONSTRAINT "nbread_invite_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."nbread_invite" OWNER TO "postgres";


COMMENT ON TABLE "public"."nbread_invite" IS '엔빵 초대 내역 테이블';



COMMENT ON COLUMN "public"."nbread_invite"."target_user_id" IS '친구 초대 대상 사용자 ID. 링크 초대는 수락 전까지 null';



COMMENT ON COLUMN "public"."nbread_invite"."invite_token" IS '친구 초대와 링크 초대가 공통으로 사용하는 공개 초대 토큰';



CREATE TABLE IF NOT EXISTS "public"."nbread_records" (
    "id" bigint NOT NULL,
    "nbread_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_date" "date" NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."nbread_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."nbread_records" IS '엔빵 납부 기록 테이블';



ALTER TABLE "public"."nbread_records" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."nbread_records_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."participant" (
    "id" bigint NOT NULL,
    "nbread_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_leader" boolean NOT NULL
);


ALTER TABLE "public"."participant" OWNER TO "postgres";


COMMENT ON TABLE "public"."participant" IS '엔빵 참여자 목록 테이블';



ALTER TABLE "public"."participant" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."nbread_user_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notification" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying NOT NULL,
    "url" "text",
    "is_read" boolean NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."notification" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification" IS '푸시 알림 데이터 저장 테이블';



ALTER TABLE "public"."notification" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notification_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."post" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_image" character varying,
    "content" "text",
    "user_id" "uuid",
    "nbread_id" "uuid" NOT NULL,
    "user_name" "text"
);


ALTER TABLE "public"."post" OWNER TO "postgres";


COMMENT ON TABLE "public"."post" IS '게시글 테이블';



ALTER TABLE "public"."post" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."post_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "social_type" character varying NOT NULL,
    "profile_image" character varying,
    "email" character varying NOT NULL,
    "tag" character varying NOT NULL,
    "terms_agreed" boolean DEFAULT false NOT NULL,
    "terms_agreed_at" timestamp with time zone,
    "terms_version" "text",
    "privacy_agreed" boolean DEFAULT false NOT NULL,
    "privacy_agreed_at" timestamp with time zone,
    "privacy_version" "text"
);


ALTER TABLE "public"."user" OWNER TO "postgres";


COMMENT ON TABLE "public"."user" IS '회원 테이블';



CREATE TABLE IF NOT EXISTS "public"."user_notification_settings" (
    "user_id" "uuid" NOT NULL,
    "all_enabled" boolean DEFAULT true NOT NULL,
    "chat_enabled" boolean DEFAULT true NOT NULL,
    "invite_enabled" boolean DEFAULT true NOT NULL,
    "friend_enabled" boolean DEFAULT true NOT NULL,
    "payment_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_notification_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."nbread_auto_generation_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."nbread_auto_generation_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fcm_token"
    ADD CONSTRAINT "fcm_token_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."fcm_token"
    ADD CONSTRAINT "fcm_token_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend"
    ADD CONSTRAINT "friend_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_sender_receiver_key" UNIQUE ("sender_id", "receiver_id");



ALTER TABLE ONLY "public"."nbread_auto_generation_logs"
    ADD CONSTRAINT "nbread_auto_generation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nbread_invite"
    ADD CONSTRAINT "nbread_invite_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."nbread_invite"
    ADD CONSTRAINT "nbread_invite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nbread"
    ADD CONSTRAINT "nbread_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nbread_records"
    ADD CONSTRAINT "nbread_records_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."nbread_records"
    ADD CONSTRAINT "nbread_records_nbread_id_payment_date_user_id_key" UNIQUE ("nbread_id", "payment_date", "user_id");



ALTER TABLE ONLY "public"."nbread_records"
    ADD CONSTRAINT "nbread_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant"
    ADD CONSTRAINT "nbread_user_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."participant"
    ADD CONSTRAINT "nbread_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant"
    ADD CONSTRAINT "participant_nbread_user_key" UNIQUE ("nbread_id", "user_id");



ALTER TABLE ONLY "public"."post"
    ADD CONSTRAINT "post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fcm_token"
    ADD CONSTRAINT "push_subscription_endpoint_key" UNIQUE ("fcm_token");



ALTER TABLE ONLY "public"."user_notification_settings"
    ADD CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_tag_key" UNIQUE ("tag");



CREATE UNIQUE INDEX "friend_pair_unique_idx" ON "public"."friend" USING "btree" (LEAST("user_id_1", "user_id_2"), GREATEST("user_id_1", "user_id_2"));



CREATE INDEX "friend_request_receiver_id_idx" ON "public"."friend_request" USING "btree" ("receiver_id");



CREATE INDEX "friend_request_sender_id_idx" ON "public"."friend_request" USING "btree" ("sender_id");



CREATE INDEX "friend_request_status_idx" ON "public"."friend_request" USING "btree" ("status");



CREATE INDEX "friend_user_id_1_idx" ON "public"."friend" USING "btree" ("user_id_1");



CREATE INDEX "friend_user_id_2_idx" ON "public"."friend" USING "btree" ("user_id_2");



CREATE INDEX "nbread_invite_nbread_target_user_idx" ON "public"."nbread_invite" USING "btree" ("nbread_id", "target_user_id") WHERE ("target_user_id" IS NOT NULL);



CREATE INDEX "nbread_invite_target_user_status_idx" ON "public"."nbread_invite" USING "btree" ("target_user_id", "status") WHERE ("target_user_id" IS NOT NULL);



CREATE INDEX "notification_user_id_idx" ON "public"."notification" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "enforce_nbread_invite_status_transition" BEFORE UPDATE OF "status" ON "public"."nbread_invite" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_nbread_invite_status_transition"();












CREATE OR REPLACE TRIGGER "trigger_create_initial_nbread_records" AFTER INSERT ON "public"."participant" FOR EACH ROW EXECUTE FUNCTION "private"."create_initial_nbread_records"();



CREATE OR REPLACE TRIGGER "trigger_init_payment_dates" BEFORE INSERT OR UPDATE OF "payment_period", "payment_month", "payment_date" ON "public"."nbread" FOR EACH ROW EXECUTE FUNCTION "public"."init_payment_dates"();



CREATE OR REPLACE TRIGGER "trigger_sync_nbread_records_on_payment_schedule_change" AFTER UPDATE OF "payment_period", "payment_month", "payment_date" ON "public"."nbread" FOR EACH ROW WHEN (((("old"."payment_period")::"text" IS DISTINCT FROM ("new"."payment_period")::"text") OR ("old"."payment_month" IS DISTINCT FROM "new"."payment_month") OR ("old"."payment_date" IS DISTINCT FROM "new"."payment_date"))) EXECUTE FUNCTION "private"."sync_nbread_records_on_payment_schedule_change"();












CREATE OR REPLACE TRIGGER "update_user_notification_settings_updated_at" BEFORE UPDATE ON "public"."user_notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_notification_settings_updated_at"();



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_nbread_id_fkey" FOREIGN KEY ("nbread_id") REFERENCES "public"."nbread"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id");



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend"
    ADD CONSTRAINT "friend_user_id_1_fkey" FOREIGN KEY ("user_id_1") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend"
    ADD CONSTRAINT "friend_user_id_2_fkey" FOREIGN KEY ("user_id_2") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nbread_auto_generation_logs"
    ADD CONSTRAINT "nbread_auto_generation_logs_nbread_id_fkey" FOREIGN KEY ("nbread_id") REFERENCES "public"."nbread"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nbread_invite"
    ADD CONSTRAINT "nbread_invite_invited_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id");



ALTER TABLE ONLY "public"."nbread_invite"
    ADD CONSTRAINT "nbread_invite_nbread_id_fkey" FOREIGN KEY ("nbread_id") REFERENCES "public"."nbread"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nbread_records"
    ADD CONSTRAINT "nbread_records_nbread_id_fkey" FOREIGN KEY ("nbread_id") REFERENCES "public"."nbread"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nbread_records"
    ADD CONSTRAINT "nbread_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant"
    ADD CONSTRAINT "nbread_user_nbread_id_fkey" FOREIGN KEY ("nbread_id") REFERENCES "public"."nbread"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant"
    ADD CONSTRAINT "nbread_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post"
    ADD CONSTRAINT "post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fcm_token"
    ADD CONSTRAINT "push_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notification_settings"
    ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can delete" ON "public"."chat_messages" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."fcm_token" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."friend" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."friend_request" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."nbread" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."nbread_invite" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."nbread_records" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."participant" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."post" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete" ON "public"."user" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."fcm_token" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."friend" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."friend_request" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."nbread" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."nbread_invite" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."nbread_records" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."participant" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."post" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can select" ON "public"."user" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update" ON "public"."chat_messages" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."fcm_token" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."friend" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."friend_request" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."nbread" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."nbread_invite" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."nbread_records" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."participant" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."post" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update" ON "public"."user" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Leaders can add themselves as participant" ON "public"."participant" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND "is_leader" AND (EXISTS ( SELECT 1
   FROM "public"."nbread"
  WHERE (("nbread"."id" = "participant"."nbread_id") AND ("nbread"."leader_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Leaders can create nbread invites" ON "public"."nbread_invite" FOR INSERT TO "authenticated" WITH CHECK (((("status")::"text" = 'pending'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."nbread"
  WHERE (("nbread"."id" = "nbread_invite"."nbread_id") AND ("nbread"."leader_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Participants can create own posts" ON "public"."post" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."participant"
  WHERE (("participant"."nbread_id" = "post"."nbread_id") AND ("participant"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Participants can send own chat messages" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."participant"
  WHERE (("participant"."nbread_id" = "chat_messages"."nbread_id") AND ("participant"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Recipients can create accepted friendships" ON "public"."friend" FOR INSERT TO "authenticated" WITH CHECK ((("user_id_1" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."friend_request"
  WHERE (("friend_request"."sender_id" = "friend"."user_id_2") AND ("friend_request"."receiver_id" = "friend"."user_id_1") AND ("friend_request"."status" = 'accepted'::"text"))))));



CREATE POLICY "Users can create own nbread" ON "public"."nbread" FOR INSERT TO "authenticated" WITH CHECK (("leader_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete their own notifications" ON "public"."notification" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "user_id")));



CREATE POLICY "Users can insert own FCM tokens" ON "public"."fcm_token" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own notification settings" ON "public"."user_notification_settings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can mark their own notifications as read" ON "public"."notification" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "user_id"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("is_read" = true)));



CREATE POLICY "Users can send own friend requests" ON "public"."friend_request" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can update own notification settings" ON "public"."user_notification_settings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own notification settings" ON "public"."user_notification_settings" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notification" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (( SELECT "auth"."uid"() AS "uid") = "user_id")));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fcm_token" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friend" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friend_request" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nbread" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nbread_auto_generation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nbread_invite" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nbread_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."participant" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notification_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
























SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;
























































































































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;

































SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;






























REVOKE ALL ON FUNCTION "private"."create_initial_nbread_records"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."sync_nbread_records_on_payment_schedule_change"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."calculate_nbread_period_start"("p_today" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_nbread_period_start"("p_today" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_nbread_period_start"("p_today" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_next_nbread_payment_date"("p_payment_date" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_next_nbread_payment_date"("p_payment_date" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_next_nbread_payment_date"("p_payment_date" "date", "p_payment_period" "text", "p_payment_month" integer, "p_payment_day" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_from_public"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_from_public"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_from_public"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_nbread_invite_status_transition"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_nbread_invite_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_nbread_records_for_due_group"("p_nbread_id" "uuid", "p_today" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_nbread_records_for_due_group"("p_nbread_id" "uuid", "p_today" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_nbread_records_for_due_group"("p_nbread_id" "uuid", "p_today" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."init_payment_dates"() TO "anon";
GRANT ALL ON FUNCTION "public"."init_payment_dates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."init_payment_dates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_into_public_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_into_public_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_into_public_users"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."respond_to_nbread_invite"("p_invite_token" "text", "p_response" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."respond_to_nbread_invite"("p_invite_token" "text", "p_response" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_nbread_invite"("p_invite_token" "text", "p_response" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_nbread_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_nbread_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_nbread_records"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_dates"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_dates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_dates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_notification_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_notification_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_notification_settings_updated_at"() TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



























GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."fcm_token" TO "anon";
GRANT ALL ON TABLE "public"."fcm_token" TO "authenticated";
GRANT ALL ON TABLE "public"."fcm_token" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fcm_token_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fcm_token_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fcm_token_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."friend" TO "anon";
GRANT ALL ON TABLE "public"."friend" TO "authenticated";
GRANT ALL ON TABLE "public"."friend" TO "service_role";



GRANT ALL ON SEQUENCE "public"."friend_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."friend_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."friend_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."friend_request" TO "anon";
GRANT ALL ON TABLE "public"."friend_request" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_request" TO "service_role";



GRANT ALL ON SEQUENCE "public"."friend_request_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."friend_request_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."friend_request_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."nbread" TO "anon";
GRANT ALL ON TABLE "public"."nbread" TO "authenticated";
GRANT ALL ON TABLE "public"."nbread" TO "service_role";



GRANT ALL ON TABLE "public"."nbread_auto_generation_logs" TO "anon";
GRANT ALL ON TABLE "public"."nbread_auto_generation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."nbread_auto_generation_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nbread_auto_generation_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nbread_auto_generation_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nbread_auto_generation_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."nbread_invite" TO "anon";
GRANT ALL ON TABLE "public"."nbread_invite" TO "authenticated";
GRANT ALL ON TABLE "public"."nbread_invite" TO "service_role";



GRANT ALL ON TABLE "public"."nbread_records" TO "anon";
GRANT ALL ON TABLE "public"."nbread_records" TO "authenticated";
GRANT ALL ON TABLE "public"."nbread_records" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nbread_records_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nbread_records_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nbread_records_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."participant" TO "anon";
GRANT ALL ON TABLE "public"."participant" TO "authenticated";
GRANT ALL ON TABLE "public"."participant" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nbread_user_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nbread_user_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nbread_user_id_seq" TO "service_role";



GRANT SELECT,DELETE,MAINTAIN ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";



GRANT UPDATE("is_read") ON TABLE "public"."notification" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."post" TO "anon";
GRANT ALL ON TABLE "public"."post" TO "authenticated";
GRANT ALL ON TABLE "public"."post" TO "service_role";



GRANT ALL ON SEQUENCE "public"."post_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."post_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."post_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."user_notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notification_settings" TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

























