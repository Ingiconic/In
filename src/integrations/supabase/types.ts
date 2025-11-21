export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          name_fa: string
          rarity: string
          requirement_type: string
          requirement_value: number
          reward_coins: number | null
          reward_xp: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          name_fa: string
          rarity?: string
          requirement_type: string
          requirement_value: number
          reward_coins?: number | null
          reward_xp?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          name_fa?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          reward_coins?: number | null
          reward_xp?: number | null
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          created_at: string | null
          id: string
          message: string
          personality_type: string | null
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          personality_type?: string | null
          response: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          personality_type?: string | null
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      ar_models: {
        Row: {
          created_at: string | null
          description: string | null
          grade: string | null
          id: string
          is_premium: boolean | null
          model_data: Json
          model_type: string | null
          price_coins: number | null
          subject: string
          thumbnail_url: string | null
          title: string
          title_fa: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grade?: string | null
          id?: string
          is_premium?: boolean | null
          model_data: Json
          model_type?: string | null
          price_coins?: number | null
          subject: string
          thumbnail_url?: string | null
          title: string
          title_fa: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grade?: string | null
          id?: string
          is_premium?: boolean | null
          model_data?: Json
          model_type?: string | null
          price_coins?: number | null
          subject?: string
          thumbnail_url?: string | null
          title?: string
          title_fa?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string | null
          forwarded_from: string | null
          id: string
          is_edited: boolean | null
          reactions: Json | null
          scheduled_at: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string | null
          forwarded_from?: string | null
          id?: string
          is_edited?: boolean | null
          reactions?: Json | null
          scheduled_at?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string | null
          forwarded_from?: string | null
          id?: string
          is_edited?: boolean | null
          reactions?: Json | null
          scheduled_at?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          resource_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          resource_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quests: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          quest_type: string
          requirement_value: number | null
          reward_coins: number | null
          reward_xp: number | null
          title: string
          title_fa: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          quest_type: string
          requirement_value?: number | null
          reward_coins?: number | null
          reward_xp?: number | null
          title: string
          title_fa: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          quest_type?: string
          requirement_value?: number | null
          reward_coins?: number | null
          reward_xp?: number | null
          title?: string
          title_fa?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string | null
          forwarded_from: string | null
          id: string
          is_edited: boolean | null
          is_read: boolean | null
          is_silent: boolean | null
          media_type: string | null
          media_url: string | null
          reactions: Json | null
          read_at: string | null
          receiver_id: string
          scheduled_at: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          forwarded_from?: string | null
          id?: string
          is_edited?: boolean | null
          is_read?: boolean | null
          is_silent?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          read_at?: string | null
          receiver_id: string
          scheduled_at?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          forwarded_from?: string | null
          id?: string
          is_edited?: boolean | null
          is_read?: boolean | null
          is_silent?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          read_at?: string | null
          receiver_id?: string
          scheduled_at?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          points_awarded: number | null
          questions: Json
          score: number | null
          title: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          questions: Json
          score?: number | null
          title: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          questions?: Json
          score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          deck_id: string
          difficulty: string | null
          id: string
          last_reviewed: string | null
          next_review: string | null
          question: string
          review_count: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          deck_id: string
          difficulty?: string | null
          id?: string
          last_reviewed?: string | null
          next_review?: string | null
          question: string
          review_count?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          deck_id?: string
          difficulty?: string | null
          id?: string
          last_reviewed?: string | null
          next_review?: string | null
          question?: string
          review_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          duration: number
          id: string
          started_at: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          duration: number
          id?: string
          started_at?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          duration?: number
          id?: string
          started_at?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          name_fa: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          name_fa: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_fa?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_best_answer: boolean | null
          topic_id: string
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_best_answer?: boolean | null
          topic_id: string
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_best_answer?: boolean | null
          topic_id?: string
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reply_votes: {
        Row: {
          created_at: string | null
          id: string
          reply_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reply_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reply_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          category_id: string
          content: string
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          replies_count: number | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          is_admin: boolean | null
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          forwarded_from: string | null
          group_id: string
          id: string
          is_edited: boolean | null
          is_silent: boolean | null
          media_type: string | null
          media_url: string | null
          reactions: Json | null
          read_by: Json | null
          reply_to_id: string | null
          scheduled_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          forwarded_from?: string | null
          group_id: string
          id?: string
          is_edited?: boolean | null
          is_silent?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          read_by?: Json | null
          reply_to_id?: string | null
          scheduled_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          forwarded_from?: string | null
          group_id?: string
          id?: string
          is_edited?: boolean | null
          is_silent?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          read_by?: Json | null
          reply_to_id?: string | null
          scheduled_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      levels: {
        Row: {
          color: string | null
          icon: string | null
          level: number
          name: string
          name_fa: string
          reward_coins: number | null
          xp_required: number
        }
        Insert: {
          color?: string | null
          icon?: string | null
          level: number
          name: string
          name_fa: string
          reward_coins?: number | null
          xp_required: number
        }
        Update: {
          color?: string | null
          icon?: string | null
          level?: number
          name?: string
          name_fa?: string
          reward_coins?: number | null
          xp_required?: number
        }
        Relationships: []
      }
      mind_maps: {
        Row: {
          created_at: string
          edges: Json
          id: string
          nodes: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      motivation_items: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          item_type: string
          position_x: number | null
          position_y: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          item_type: string
          position_x?: number | null
          position_y?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          item_type?: string
          position_x?: number | null
          position_y?: number | null
          user_id?: string
        }
        Relationships: []
      }
      music_playlists: {
        Row: {
          created_at: string | null
          genre: string
          id: string
          is_premium: boolean | null
          name: string
          name_fa: string
          thumbnail_url: string | null
          tracks: Json
        }
        Insert: {
          created_at?: string | null
          genre: string
          id?: string
          is_premium?: boolean | null
          name: string
          name_fa: string
          thumbnail_url?: string | null
          tracks?: Json
        }
        Update: {
          created_at?: string | null
          genre?: string
          id?: string
          is_premium?: boolean | null
          name?: string
          name_fa?: string
          thumbnail_url?: string | null
          tracks?: Json
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_favorite: boolean | null
          is_pinned: boolean | null
          pdf_annotations: Json | null
          pdf_file_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          pdf_annotations?: Json | null
          pdf_file_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          pdf_annotations?: Json | null
          pdf_file_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          icon: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          page_path: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          page_path: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          page_path?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      pinned_chats: {
        Row: {
          chat_id: string
          chat_type: string
          id: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          id?: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          id?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string
          points_change: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          points_change: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          points_change?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          break_duration: number | null
          completed: boolean | null
          completed_at: string | null
          duration: number
          id: string
          notes: string | null
          started_at: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          break_duration?: number | null
          completed?: boolean | null
          completed_at?: string | null
          duration: number
          id?: string
          notes?: string | null
          started_at?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          break_duration?: number | null
          completed?: boolean | null
          completed_at?: string | null
          duration?: number
          id?: string
          notes?: string | null
          started_at?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_avatar: string | null
          active_theme: string | null
          ai_buddy_personality: string | null
          avatar_customization: Json | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          coins: number | null
          created_at: string
          exams_taken: number | null
          field: string | null
          full_name: string
          grade: string | null
          id: string
          is_online: boolean | null
          last_activity_date: string | null
          last_seen: string | null
          level: number | null
          music_preferences: Json | null
          notification_settings: Json | null
          pet_active: boolean | null
          points: number | null
          referral_code: string | null
          referred_by: string | null
          streak_days: number | null
          theme: string | null
          updated_at: string
          username: string | null
          xp: number | null
        }
        Insert: {
          active_avatar?: string | null
          active_theme?: string | null
          ai_buddy_personality?: string | null
          avatar_customization?: Json | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          coins?: number | null
          created_at?: string
          exams_taken?: number | null
          field?: string | null
          full_name: string
          grade?: string | null
          id: string
          is_online?: boolean | null
          last_activity_date?: string | null
          last_seen?: string | null
          level?: number | null
          music_preferences?: Json | null
          notification_settings?: Json | null
          pet_active?: boolean | null
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number | null
          theme?: string | null
          updated_at?: string
          username?: string | null
          xp?: number | null
        }
        Update: {
          active_avatar?: string | null
          active_theme?: string | null
          ai_buddy_personality?: string | null
          avatar_customization?: Json | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          coins?: number | null
          created_at?: string
          exams_taken?: number | null
          field?: string | null
          full_name?: string
          grade?: string | null
          id?: string
          is_online?: boolean | null
          last_activity_date?: string | null
          last_seen?: string | null
          level?: number | null
          music_preferences?: Json | null
          notification_settings?: Json | null
          pet_active?: boolean | null
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number | null
          theme?: string | null
          updated_at?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question: string
          subject: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question: string
          subject?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_messages: {
        Row: {
          id: string
          message_id: string
          message_type: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          message_type: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          message_type?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          is_available: boolean | null
          item_type: string
          metadata: Json | null
          name: string
          name_fa: string
          price_coins: number
          rarity: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          is_available?: boolean | null
          item_type: string
          metadata?: Json | null
          name: string
          name_fa: string
          price_coins: number
          rarity?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          is_available?: boolean | null
          item_type?: string
          metadata?: Json | null
          name?: string
          name_fa?: string
          price_coins?: number
          rarity?: string | null
        }
        Relationships: []
      }
      step_by_step_solutions: {
        Row: {
          created_at: string | null
          field: string | null
          grade: string
          id: string
          page_number: number
          question_number: number
          solution: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          field?: string | null
          grade: string
          id?: string
          page_number: number
          question_number: number
          solution: string
          subject: string
        }
        Update: {
          created_at?: string | null
          field?: string | null
          grade?: string
          id?: string
          page_number?: number
          question_number?: number
          solution?: string
          subject?: string
        }
        Relationships: []
      }
      study_battle_queue: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      study_battles: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          player1_id: string
          player1_score: number | null
          player2_id: string
          player2_score: number | null
          questions: Json
          status: string | null
          subject: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          player1_id: string
          player1_score?: number | null
          player2_id: string
          player2_score?: number | null
          questions: Json
          status?: string | null
          subject: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          player1_id?: string
          player1_score?: number | null
          player2_id?: string
          player2_score?: number | null
          questions?: Json
          status?: string | null
          subject?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      study_books: {
        Row: {
          book_type: string
          content: string
          created_at: string | null
          field: string | null
          grade: string
          id: string
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          book_type?: string
          content: string
          created_at?: string | null
          field?: string | null
          grade: string
          id?: string
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          book_type?: string
          content?: string
          created_at?: string | null
          field?: string | null
          grade?: string
          id?: string
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      study_companion_data: {
        Row: {
          ai_insights: Json | null
          created_at: string | null
          difficulty_areas: string[] | null
          focus_duration_avg: number | null
          id: string
          last_analysis_at: string | null
          learning_style: string | null
          optimal_study_times: Json | null
          preferred_subjects: string[] | null
          study_patterns: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          created_at?: string | null
          difficulty_areas?: string[] | null
          focus_duration_avg?: number | null
          id?: string
          last_analysis_at?: string | null
          learning_style?: string | null
          optimal_study_times?: Json | null
          preferred_subjects?: string[] | null
          study_patterns?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_insights?: Json | null
          created_at?: string | null
          difficulty_areas?: string[] | null
          focus_duration_avg?: number | null
          id?: string
          last_analysis_at?: string | null
          learning_style?: string | null
          optimal_study_times?: Json | null
          preferred_subjects?: string[] | null
          study_patterns?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_events: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          duration: number | null
          event_date: string
          event_time: string | null
          id: string
          reminder_enabled: boolean | null
          reminder_minutes: number | null
          subject: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          event_date: string
          event_time?: string | null
          id?: string
          reminder_enabled?: boolean | null
          reminder_minutes?: number | null
          subject?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          event_date?: string
          event_time?: string | null
          id?: string
          reminder_enabled?: boolean | null
          reminder_minutes?: number | null
          subject?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          content: string
          created_at: string
          grade: string | null
          id: string
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          grade?: string | null
          id?: string
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          grade?: string | null
          id?: string
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          start_date: string
          subjects: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          subjects?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          subjects?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_study_date: string | null
          longest_streak: number | null
          streak_milestones: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_study_date?: string | null
          longest_streak?: number | null
          streak_milestones?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_study_date?: string | null
          longest_streak?: number | null
          streak_milestones?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unread_messages: {
        Row: {
          chat_id: string
          chat_type: string
          id: string
          last_message_at: string | null
          unread_count: number | null
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          id?: string
          last_message_at?: string | null
          unread_count?: number | null
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          id?: string
          last_message_at?: string | null
          unread_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatars: {
        Row: {
          avatar_parts: Json
          created_at: string | null
          customization_unlocks: string[] | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_parts?: Json
          created_at?: string | null
          customization_unlocks?: string[] | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_parts?: Json
          created_at?: string | null
          customization_unlocks?: string[] | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_quests: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          quest_date: string | null
          quest_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          quest_date?: string | null
          quest_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          quest_date?: string | null
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "daily_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          id: string
          milestones: Json | null
          progress: number | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestones?: Json | null
          progress?: number | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestones?: Json | null
          progress?: number | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_pets: {
        Row: {
          created_at: string | null
          customization: Json | null
          id: string
          last_fed_at: string | null
          last_played_at: string | null
          pet_happiness: number | null
          pet_hunger: number | null
          pet_level: number | null
          pet_name: string
          pet_type: string
          pet_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customization?: Json | null
          id?: string
          last_fed_at?: string | null
          last_played_at?: string | null
          pet_happiness?: number | null
          pet_hunger?: number | null
          pet_level?: number | null
          pet_name: string
          pet_type: string
          pet_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customization?: Json | null
          id?: string
          last_fed_at?: string | null
          last_played_at?: string | null
          pet_happiness?: number | null
          pet_hunger?: number | null
          pet_level?: number | null
          pet_name?: string
          pet_type?: string
          pet_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          is_active: boolean | null
          item_id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          item_id: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          item_id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_themes: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          font_family: string | null
          font_size: string | null
          id: string
          theme_mode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          font_family?: string | null
          font_size?: string | null
          id?: string
          theme_mode?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          font_family?: string | null
          font_size?: string | null
          id?: string
          theme_mode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          achievements_count: number | null
          avatar_url: string | null
          exams_taken: number | null
          full_name: string | null
          id: string | null
          level: number | null
          points: number | null
          rank: number | null
          streak_days: number | null
          username: string | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_user_coins: {
        Args: {
          adjustment_reason: string
          coin_amount: number
          target_user_id: string
        }
        Returns: undefined
      }
      award_exam_points: {
        Args: { exam_id_param: string; points_to_award: number }
        Returns: undefined
      }
      award_xp: {
        Args: { _reason: string; _user_id: string; _xp_amount: number }
        Returns: Json
      }
      check_achievements: { Args: { _user_id: string }; Returns: Json }
      create_friendship: { Args: { request_id: string }; Returns: undefined }
      create_notification: {
        Args: {
          _action_url?: string
          _icon?: string
          _message: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      deduct_user_coins: {
        Args: { _amount: number; _reason: string }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      get_user_coins: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_topic_views: {
        Args: { topic_id_param: string }
        Returns: undefined
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      purchase_shop_item: { Args: { _item_id: string }; Returns: Json }
      update_last_seen: { Args: never; Returns: undefined }
      vote_forum_reply: {
        Args: { _reply_id: string; _vote_type: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
