-- Chat feature migration for BroJam
-- Add conversations and messages tables to support chat functionality

-- Conversations table to track chat sessions between users
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  participant_2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  borrow_request_id UUID REFERENCES public.borrow_requests(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure participants are different users
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  
  -- Ensure unique conversation per pair of users for each borrow request
  CONSTRAINT unique_conversation_per_request UNIQUE (participant_1_id, participant_2_id, borrow_request_id)
);

-- Messages table to store individual chat messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update conversation's last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create conversation if it doesn't exist
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_borrow_request_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant_1 UUID;
  participant_2 UUID;
BEGIN
  -- Ensure consistent ordering of participants (smaller UUID first)
  IF p_user1_id < p_user2_id THEN
    participant_1 := p_user1_id;
    participant_2 := p_user2_id;
  ELSE
    participant_1 := p_user2_id;
    participant_2 := p_user1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE participant_1_id = participant_1 
    AND participant_2_id = participant_2
    AND (borrow_request_id = p_borrow_request_id OR (borrow_request_id IS NULL AND p_borrow_request_id IS NULL))
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id, borrow_request_id)
    VALUES (participant_1, participant_2, p_borrow_request_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations they participate in" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- Indexes for better performance
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_borrow_request ON conversations(borrow_request_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- View to get conversation details with participant info
CREATE VIEW conversation_details AS
SELECT 
  c.id,
  c.participant_1_id,
  c.participant_2_id,
  c.borrow_request_id,
  c.last_message_at,
  c.created_at,
  u1.full_name as participant_1_name,
  u1.avatar_url as participant_1_avatar,
  u2.full_name as participant_2_name,
  u2.avatar_url as participant_2_avatar,
  br.message as request_message,
  i.title as item_title
FROM conversations c
LEFT JOIN users u1 ON c.participant_1_id = u1.id
LEFT JOIN users u2 ON c.participant_2_id = u2.id
LEFT JOIN borrow_requests br ON c.borrow_request_id = br.id
LEFT JOIN items i ON br.item_id = i.id;

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;