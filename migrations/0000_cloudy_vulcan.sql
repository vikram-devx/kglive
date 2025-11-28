CREATE TABLE "deposit_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subadmin_id" integer NOT NULL,
	"commission_rate" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_odds" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_type" text NOT NULL,
	"odd_value" integer NOT NULL,
	"set_by_admin" boolean DEFAULT true NOT NULL,
	"subadmin_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_type" text DEFAULT 'coin_flip' NOT NULL,
	"bet_amount" integer NOT NULL,
	"prediction" text NOT NULL,
	"result" text,
	"payout" integer DEFAULT 0 NOT NULL,
	"balance_after" integer,
	"created_at" timestamp DEFAULT now(),
	"market_id" integer,
	"match_id" integer,
	"game_mode" text,
	"game_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "player_deposit_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"subadmin_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"discount_rate" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "satamatka_markets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"open_time" timestamp NOT NULL,
	"close_time" timestamp NOT NULL,
	"result_time" timestamp,
	"open_result" text,
	"close_result" text,
	"status" text DEFAULT 'waiting' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_pattern" text DEFAULT 'daily',
	"last_resulted_date" timestamp,
	"next_open_time" timestamp,
	"next_close_time" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subadmin_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subadmin_id" integer NOT NULL,
	"game_type" text NOT NULL,
	"commission_rate" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_type" text NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_a" text NOT NULL,
	"team_b" text NOT NULL,
	"category" text DEFAULT 'cricket' NOT NULL,
	"description" text,
	"match_time" timestamp NOT NULL,
	"result" text DEFAULT 'pending' NOT NULL,
	"odd_team_a" integer DEFAULT 200 NOT NULL,
	"odd_team_b" integer DEFAULT 200 NOT NULL,
	"odd_draw" integer DEFAULT 300,
	"status" text DEFAULT 'open' NOT NULL,
	"team_a_image" text,
	"team_b_image" text,
	"cover_image" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer,
	"performed_by" integer NOT NULL,
	"description" text,
	"request_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"subadmin_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"game_type" text NOT NULL,
	"discount_rate" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"mobile" text,
	"role" text DEFAULT 'player' NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"assigned_to" integer,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_by" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "wallet_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"request_type" text NOT NULL,
	"payment_mode" text NOT NULL,
	"payment_details" json NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"proof_image_url" text,
	"notes" text,
	"reviewed_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deposit_commissions" ADD CONSTRAINT "deposit_commissions_subadmin_id_users_id_fk" FOREIGN KEY ("subadmin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_odds" ADD CONSTRAINT "game_odds_subadmin_id_users_id_fk" FOREIGN KEY ("subadmin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_market_id_satamatka_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."satamatka_markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_match_id_team_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."team_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_deposit_discounts" ADD CONSTRAINT "player_deposit_discounts_subadmin_id_users_id_fk" FOREIGN KEY ("subadmin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_deposit_discounts" ADD CONSTRAINT "player_deposit_discounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subadmin_commissions" ADD CONSTRAINT "subadmin_commissions_subadmin_id_users_id_fk" FOREIGN KEY ("subadmin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_request_id_wallet_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."wallet_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_discounts" ADD CONSTRAINT "user_discounts_subadmin_id_users_id_fk" FOREIGN KEY ("subadmin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_discounts" ADD CONSTRAINT "user_discounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_requests" ADD CONSTRAINT "wallet_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_requests" ADD CONSTRAINT "wallet_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");