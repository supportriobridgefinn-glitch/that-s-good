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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_applications: {
        Row: {
          account_type: string
          admin_notes: string
          country: string
          created_at: string
          currency: string
          email: string
          first_name: string
          id: string
          last_name: string
          middle_name: string
          phone: string
          pin_hash: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          username: string
        }
        Insert: {
          account_type?: string
          admin_notes?: string
          country?: string
          created_at?: string
          currency?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          middle_name?: string
          phone?: string
          pin_hash?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          username: string
        }
        Update: {
          account_type?: string
          admin_notes?: string
          country?: string
          created_at?: string
          currency?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string
          phone?: string
          pin_hash?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      account_statements: {
        Row: {
          account_id: string
          closing_balance: number
          generated_at: string
          id: string
          opening_balance: number
          period_end: string
          period_start: string
          summary: Json
          user_id: string
        }
        Insert: {
          account_id: string
          closing_balance?: number
          generated_at?: string
          id?: string
          opening_balance?: number
          period_end: string
          period_start: string
          summary?: Json
          user_id: string
        }
        Update: {
          account_id?: string
          closing_balance?: number
          generated_at?: string
          id?: string
          opening_balance?: number
          period_end?: string
          period_start?: string
          summary?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_statements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          from_account_id: string
          id: string
          idempotency_key: string
          note: string
          status: string
          to_account_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          from_account_id: string
          id?: string
          idempotency_key: string
          note?: string
          status?: string
          to_account_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          from_account_id?: string
          id?: string
          idempotency_key?: string
          note?: string
          status?: string
          to_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          account_number: string
          bank_name: string
          beneficiary_type: string
          created_at: string
          id: string
          name: string
          routing_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          bank_name?: string
          beneficiary_type?: string
          created_at?: string
          id?: string
          name: string
          routing_number?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          bank_name?: string
          beneficiary_type?: string
          created_at?: string
          id?: string
          name?: string
          routing_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_positions: {
        Row: {
          created_at: string
          current_value: number
          id: string
          liquidated_at: string | null
          liquidation_requested_at: string | null
          maturity_date: string | null
          name: string
          opened_at: string
          pending_returns: number
          principal: number
          realized_returns: number
          status: Database["public"]["Enums"]["investment_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          liquidated_at?: string | null
          liquidation_requested_at?: string | null
          maturity_date?: string | null
          name: string
          opened_at?: string
          pending_returns?: number
          principal?: number
          realized_returns?: number
          status?: Database["public"]["Enums"]["investment_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          liquidated_at?: string | null
          liquidation_requested_at?: string | null
          maturity_date?: string | null
          name?: string
          opened_at?: string
          pending_returns?: number
          principal?: number
          realized_returns?: number
          status?: Database["public"]["Enums"]["investment_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          note: string
          position_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kind: string
          note?: string
          position_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          note?: string
          position_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "investment_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          actor_id: string | null
          actor_role: string
          amount: number
          category: string
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["ledger_direction"]
          disbursement_id: string | null
          id: string
          idempotency_key: string
          investment_position_id: string | null
          loan_id: string | null
          previous_balance: number
          reason: string
          resulting_balance: number
          transfer_id: string | null
          user_id: string
          withdrawal_request_id: string | null
        }
        Insert: {
          account_id: string
          actor_id?: string | null
          actor_role?: string
          amount: number
          category: string
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["ledger_direction"]
          disbursement_id?: string | null
          id?: string
          idempotency_key: string
          investment_position_id?: string | null
          loan_id?: string | null
          previous_balance: number
          reason?: string
          resulting_balance: number
          transfer_id?: string | null
          user_id: string
          withdrawal_request_id?: string | null
        }
        Update: {
          account_id?: string
          actor_id?: string | null
          actor_role?: string
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["ledger_direction"]
          disbursement_id?: string | null
          id?: string
          idempotency_key?: string
          investment_position_id?: string | null
          loan_id?: string | null
          previous_balance?: number
          reason?: string
          resulting_balance?: number
          transfer_id?: string | null
          user_id?: string
          withdrawal_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_disbursements: {
        Row: {
          approved_amount: number
          created_at: string
          created_by: string | null
          disbursed_at: string
          id: string
          loan_id: string
          loan_status: string
          reference: string
          repayment_amount: number
          repayment_schedule: Json
          user_id: string
        }
        Insert: {
          approved_amount: number
          created_at?: string
          created_by?: string | null
          disbursed_at?: string
          id?: string
          loan_id: string
          loan_status?: string
          reference: string
          repayment_amount?: number
          repayment_schedule?: Json
          user_id: string
        }
        Update: {
          approved_amount?: number
          created_at?: string
          created_by?: string | null
          disbursed_at?: string
          id?: string
          loan_id?: string
          loan_status?: string
          reference?: string
          repayment_amount?: number
          repayment_schedule?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_disbursements_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_amount: number
          loan_id: string
          payment_date: string
          principal_amount: number
          reference: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          interest_amount?: number
          loan_id: string
          payment_date?: string
          principal_amount?: number
          reference: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_amount?: number
          loan_id?: string
          payment_date?: string
          principal_amount?: number
          reference?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          application_reference: string
          approved_at: string | null
          created_at: string
          disbursed_at: string | null
          id: string
          interest_rate: number | null
          monthly_payment: number
          next_payment_date: string | null
          outstanding_principal: number
          principal: number
          purpose: string | null
          status: string
          term_months: number | null
          total_repayment: number
          updated_at: string
          user_id: string
        }
        Insert: {
          application_reference?: string
          approved_at?: string | null
          created_at?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number | null
          monthly_payment?: number
          next_payment_date?: string | null
          outstanding_principal?: number
          principal?: number
          purpose?: string | null
          status?: string
          term_months?: number | null
          total_repayment?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          application_reference?: string
          approved_at?: string | null
          created_at?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number | null
          monthly_payment?: number
          next_payment_date?: string | null
          outstanding_principal?: number
          principal?: number
          purpose?: string | null
          status?: string
          term_months?: number | null
          total_repayment?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_method_configs: {
        Row: {
          display_name: string
          enabled: boolean
          estimated_time: string
          fee_flat: number
          fee_percent: number
          kind: Database["public"]["Enums"]["payout_kind"]
          max_amount: number | null
          min_amount: number
          network_fee: number
          new_destination_delay_hours: number
          provider_configured: boolean
          provider_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          display_name: string
          enabled?: boolean
          estimated_time?: string
          fee_flat?: number
          fee_percent?: number
          kind: Database["public"]["Enums"]["payout_kind"]
          max_amount?: number | null
          min_amount?: number
          network_fee?: number
          new_destination_delay_hours?: number
          provider_configured?: boolean
          provider_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          display_name?: string
          enabled?: boolean
          estimated_time?: string
          fee_flat?: number
          fee_percent?: number
          kind?: Database["public"]["Enums"]["payout_kind"]
          max_amount?: number | null
          min_amount?: number
          network_fee?: number
          new_destination_delay_hours?: number
          provider_configured?: boolean
          provider_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payout_methods: {
        Row: {
          archived_at: string | null
          created_at: string
          details: Json
          id: string
          is_verified: boolean
          kind: Database["public"]["Enums"]["payout_kind"]
          label: string
          masked_destination: string
          provider_token: string | null
          status: string
          updated_at: string
          usable_after: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          details?: Json
          id?: string
          is_verified?: boolean
          kind: Database["public"]["Enums"]["payout_kind"]
          label?: string
          masked_destination: string
          provider_token?: string | null
          status?: string
          updated_at?: string
          usable_after?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          details?: Json
          id?: string
          is_verified?: boolean
          kind?: Database["public"]["Enums"]["payout_kind"]
          label?: string
          masked_destination?: string
          provider_token?: string | null
          status?: string
          updated_at?: string
          usable_after?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      pin_verification_attempts: {
        Row: {
          created_at: string
          id: string
          succeeded: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          succeeded?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          succeeded?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_number: string
          account_type: string
          address: string
          annual_income: number
          btc_balance: number
          btc_deposit_address: string
          card_expiry: string
          card_last4: string
          card_network: string
          card_type: string
          checking_balance: number
          city: string
          country: string
          created_at: string
          currency: string
          date_of_birth: string | null
          email: string
          email_verified: boolean
          employer: string
          first_name: string
          full_name: string
          historical_pdf_path: string
          id: string
          kyc_status: string
          last_name: string
          loans_balance: number
          marital_status: string
          middle_name: string
          occupation: string
          opened_date: string
          opening_balance: number
          phone: string
          phone_verified: boolean
          pin_hash: string
          routing_number: string
          savings_balance: number
          state: string
          status: Database["public"]["Enums"]["account_status"]
          two_factor_enabled: boolean
          updated_at: string
          wallet_unlock_deadline: string | null
          withdrawals_suspended: boolean
          zip: string
        }
        Insert: {
          account_number: string
          account_type?: string
          address?: string
          annual_income?: number
          btc_balance?: number
          btc_deposit_address?: string
          card_expiry?: string
          card_last4?: string
          card_network?: string
          card_type?: string
          checking_balance?: number
          city?: string
          country?: string
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean
          employer?: string
          first_name?: string
          full_name?: string
          historical_pdf_path?: string
          id: string
          kyc_status?: string
          last_name?: string
          loans_balance?: number
          marital_status?: string
          middle_name?: string
          occupation?: string
          opened_date?: string
          opening_balance?: number
          phone?: string
          phone_verified?: boolean
          pin_hash?: string
          routing_number?: string
          savings_balance?: number
          state?: string
          status?: Database["public"]["Enums"]["account_status"]
          two_factor_enabled?: boolean
          updated_at?: string
          wallet_unlock_deadline?: string | null
          withdrawals_suspended?: boolean
          zip?: string
        }
        Update: {
          account_number?: string
          account_type?: string
          address?: string
          annual_income?: number
          btc_balance?: number
          btc_deposit_address?: string
          card_expiry?: string
          card_last4?: string
          card_network?: string
          card_type?: string
          checking_balance?: number
          city?: string
          country?: string
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean
          employer?: string
          first_name?: string
          full_name?: string
          historical_pdf_path?: string
          id?: string
          kyc_status?: string
          last_name?: string
          loans_balance?: number
          marital_status?: string
          middle_name?: string
          occupation?: string
          opened_date?: string
          opening_balance?: number
          phone?: string
          phone_verified?: boolean
          pin_hash?: string
          routing_number?: string
          savings_balance?: number
          state?: string
          status?: Database["public"]["Enums"]["account_status"]
          two_factor_enabled?: boolean
          updated_at?: string
          wallet_unlock_deadline?: string | null
          withdrawals_suspended?: boolean
          zip?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          display_name: string
          id: string
          last_message_at: string
          user_id: string | null
          visitor_token: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          last_message_at?: string
          user_id?: string | null
          visitor_token?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          last_message_at?: string
          user_id?: string | null
          visitor_token?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: Database["public"]["Enums"]["txn_account"]
          amount: number
          counterparty: Json
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["txn_direction"]
          id: string
          memo: string
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Insert: {
          account: Database["public"]["Enums"]["txn_account"]
          amount: number
          counterparty?: Json
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["txn_direction"]
          id?: string
          memo?: string
          status?: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Update: {
          account?: Database["public"]["Enums"]["txn_account"]
          amount?: number
          counterparty?: Json
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["txn_direction"]
          id?: string
          memo?: string
          status?: Database["public"]["Enums"]["txn_status"]
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          available_balance: number
          created_at: string
          currency: string
          held_balance: number
          id: string
          is_primary: boolean
          kind: Database["public"]["Enums"]["account_kind"]
          last_transaction_at: string | null
          pending_balance: number
          savings_goal: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency?: string
          held_balance?: number
          id?: string
          is_primary?: boolean
          kind: Database["public"]["Enums"]["account_kind"]
          last_transaction_at?: string | null
          pending_balance?: number
          savings_goal?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency?: string
          held_balance?: number
          id?: string
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["account_kind"]
          last_transaction_at?: string | null
          pending_balance?: number
          savings_goal?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_id: string
          admin_notes: string
          amount: number
          created_at: string
          currency: string
          decided_at: string | null
          destination_summary: string
          estimated_time: string
          hold_active: boolean
          id: string
          idempotency_key: string
          net_amount: number
          network_fee: number
          paid_at: string | null
          payout_kind: Database["public"]["Enums"]["payout_kind"]
          payout_method_id: string | null
          processing_fee: number
          provider_reference: string
          status: Database["public"]["Enums"]["withdrawal_state"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          admin_notes?: string
          amount: number
          created_at?: string
          currency?: string
          decided_at?: string | null
          destination_summary?: string
          estimated_time?: string
          hold_active?: boolean
          id?: string
          idempotency_key: string
          net_amount?: number
          network_fee?: number
          paid_at?: string | null
          payout_kind: Database["public"]["Enums"]["payout_kind"]
          payout_method_id?: string | null
          processing_fee?: number
          provider_reference?: string
          status?: Database["public"]["Enums"]["withdrawal_state"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          admin_notes?: string
          amount?: number
          created_at?: string
          currency?: string
          decided_at?: string | null
          destination_summary?: string
          estimated_time?: string
          hold_active?: boolean
          id?: string
          idempotency_key?: string
          net_amount?: number
          network_fee?: number
          paid_at?: string | null
          payout_kind?: Database["public"]["Enums"]["payout_kind"]
          payout_method_id?: string | null
          processing_fee?: number
          provider_reference?: string
          status?: Database["public"]["Enums"]["withdrawal_state"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_payout_method_id_fkey"
            columns: ["payout_method_id"]
            isOneToOne: false
            referencedRelation: "payout_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_status_history: {
        Row: {
          actor_id: string | null
          actor_role: string
          created_at: string
          from_status: Database["public"]["Enums"]["withdrawal_state"] | null
          id: string
          note: string
          to_status: Database["public"]["Enums"]["withdrawal_state"]
          user_id: string
          withdrawal_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["withdrawal_state"] | null
          id?: string
          note?: string
          to_status: Database["public"]["Enums"]["withdrawal_state"]
          user_id: string
          withdrawal_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["withdrawal_state"] | null
          id?: string
          note?: string
          to_status?: Database["public"]["Enums"]["withdrawal_state"]
          user_id?: string
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_status_history_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_hold: {
        Args: { _account_id: string; _amount: number; _mode: string }
        Returns: undefined
      }
      ensure_user_accounts: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_pin: { Args: { _pin: string }; Returns: string }
      post_ledger_entry: {
        Args: {
          _actor_id: string
          _actor_role: string
          _amount: number
          _category: string
          _direction: Database["public"]["Enums"]["ledger_direction"]
          _idempotency_key: string
          _kind: Database["public"]["Enums"]["account_kind"]
          _reason: string
          _refs?: Json
          _user_id: string
        }
        Returns: string
      }
      refresh_profile_loan_balance: {
        Args: { _user_id: string }
        Returns: undefined
      }
      verify_pin: { Args: { _pin: string; _user_id: string }; Returns: boolean }
      visitor_get_or_create_thread: {
        Args: { _token: string }
        Returns: string
      }
      visitor_list_messages: {
        Args: { _thread: string; _token: string }
        Returns: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
          thread_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "support_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      visitor_send_message: {
        Args: { _body: string; _thread: string; _token: string }
        Returns: undefined
      }
    }
    Enums: {
      account_kind: "earning" | "savings" | "investment"
      account_status: "active" | "suspended" | "closed"
      app_role: "admin" | "customer"
      application_status: "pending" | "approved" | "rejected"
      investment_state:
        | "active"
        | "matured"
        | "liquidation_requested"
        | "liquidated"
        | "cancelled"
      ledger_direction: "debit" | "credit"
      payout_kind:
        | "bank_transfer"
        | "ach"
        | "wire"
        | "bitcoin"
        | "paypal"
        | "venmo"
        | "card"
        | "cashapp"
        | "other"
      txn_account: "checking" | "savings" | "loans" | "btc"
      txn_direction: "debit" | "credit"
      txn_status: "pending" | "completed" | "failed"
      txn_type:
        | "local"
        | "wire"
        | "international"
        | "btc_send"
        | "btc_receive"
        | "admin_adjustment"
      withdrawal_state:
        | "draft"
        | "submitted"
        | "identity_verification_required"
        | "under_review"
        | "approved"
        | "processing"
        | "paid"
        | "failed"
        | "rejected"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_kind: ["earning", "savings", "investment"],
      account_status: ["active", "suspended", "closed"],
      app_role: ["admin", "customer"],
      application_status: ["pending", "approved", "rejected"],
      investment_state: [
        "active",
        "matured",
        "liquidation_requested",
        "liquidated",
        "cancelled",
      ],
      ledger_direction: ["debit", "credit"],
      payout_kind: [
        "bank_transfer",
        "ach",
        "wire",
        "bitcoin",
        "paypal",
        "venmo",
        "card",
        "cashapp",
        "other",
      ],
      txn_account: ["checking", "savings", "loans", "btc"],
      txn_direction: ["debit", "credit"],
      txn_status: ["pending", "completed", "failed"],
      txn_type: [
        "local",
        "wire",
        "international",
        "btc_send",
        "btc_receive",
        "admin_adjustment",
      ],
      withdrawal_state: [
        "draft",
        "submitted",
        "identity_verification_required",
        "under_review",
        "approved",
        "processing",
        "paid",
        "failed",
        "rejected",
        "cancelled",
      ],
    },
  },
} as const
