-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Linked to auth.users.id
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    balance NUMERIC(18, 2) DEFAULT 0,
    total_deposits NUMERIC(18, 2) DEFAULT 0,
    total_withdrawals NUMERIC(18, 2) DEFAULT 0,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    security_question_1_id TEXT,
    security_question_1_answer_hash TEXT,
    security_question_2_id TEXT,
    security_question_2_answer_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Security Questions Table
CREATE TABLE IF NOT EXISTS security_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Investment Plans Table
CREATE TABLE IF NOT EXISTS investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_amount NUMERIC(18, 2) NOT NULL,
    max_amount NUMERIC(18, 2),
    roi_percentage NUMERIC(5, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Investments Table
CREATE TABLE IF NOT EXISTS user_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES investment_plans(id),
    amount NUMERIC(18, 2) NOT NULL,
    expected_return NUMERIC(18, 2) NOT NULL,
    status TEXT DEFAULT 'active', -- active, completed
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Deposits Table (Updated for NowPayments)
CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL,
    currency TEXT NOT NULL,
    payment_id TEXT,
    payment_address TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, success, failed
    webhook_data TEXT,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL,
    processing_fee NUMERIC(18, 2) DEFAULT 0,
    final_amount NUMERIC(18, 2) NOT NULL,
    wallet_address TEXT NOT NULL,
    network TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, completed, rejected
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Gift Codes Table
CREATE TABLE IF NOT EXISTS gift_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    reward_amount NUMERIC(18, 2) NOT NULL,
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Gift Redemptions Table
CREATE TABLE IF NOT EXISTS gift_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_code_id UUID NOT NULL REFERENCES gift_codes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Sample Investment Plans
INSERT INTO investment_plans (name, min_amount, max_amount, roi_percentage, duration_days, description, image_url)
VALUES 
('Starter Plan', 10, 50, 20, 7, 'Perfect for beginners', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Growth Plan', 51, 150, 35, 7, 'Steady growth for your portfolio', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Premium Plan', 151, 400, 50, 7, 'High returns for serious investors', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('VIP Plan', 401, 1000, 70, 7, 'Exclusive benefits and top-tier returns', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Elite Plan', 1001, NULL, 100, 7, 'The ultimate investment experience', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400');

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can view own questions" ON security_questions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own questions" ON security_questions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own investments" ON user_investments FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own deposits" ON deposits FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own deposits" ON deposits FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own redemptions" ON gift_redemptions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own redemptions" ON gift_redemptions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Anyone can view active plans" ON investment_plans FOR SELECT USING (is_active = true);
