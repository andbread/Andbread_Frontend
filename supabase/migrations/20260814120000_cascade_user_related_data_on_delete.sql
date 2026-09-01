ALTER TABLE ONLY "public"."chat_messages"
    DROP CONSTRAINT "chat_messages_user_id_fkey",
    ADD CONSTRAINT "chat_messages_user_id_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "public"."user"("id")
        ON DELETE CASCADE;

ALTER TABLE ONLY "public"."nbread_invite"
    DROP CONSTRAINT "nbread_invite_invited_user_id_fkey",
    ADD CONSTRAINT "nbread_invite_invited_user_id_fkey"
        FOREIGN KEY ("target_user_id")
        REFERENCES "public"."user"("id")
        ON DELETE CASCADE;
