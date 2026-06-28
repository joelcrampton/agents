CREATE TABLE "wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"price" numeric(10, 2),
	"currency" text,
	"url" text NOT NULL,
	"image_url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
