import { supabase, db } from './supabase'

/**
 * Initiate video generation process
 * @param {string} chatId - Chat ID
 * @param {string} prompt - Video description
 * @param {string} imageUrl - Optional image URL
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Video record
 */
export const initiateVideoGeneration = async (chatId, prompt, imageUrl = null, userId) => {
  try {
    // Create video record with initial status
    const { data: video, error: videoError } = await supabase
      .from('video')
      .insert({
        chat_id: chatId,
        prompt,
        image_url: imageUrl,
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        credits_used: 10, // Default credit cost
        idempotency_key: `${chatId}-${Date.now()}`
      })
      .select()
      .single()

    if (videoError) throw videoError

    // Update chat with active video
    await supabase
      .from('chat')
      .update({
        active_video_id: video.id,
        production_started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('id', chatId)

    // Deduct credits from user (using RPC function)
    const { error: creditsError } = await supabase.rpc('deduct_user_credits', {
      user_id: userId,
      credits_to_deduct: 10
    })

    if (creditsError) {
      console.error('Error deducting credits:', creditsError)
      // Continue anyway - we'll handle this in the UI
    }

    // Start video processing simulation
    processVideo(video.id)

    return video
  } catch (error) {
    console.error('Error initiating video generation:', error)
    throw error
  }
}

/**
 * Simulate video processing
 * @param {string} videoId - Video ID to process
 */
const processVideo = async (videoId) => {
  try {
    // Simulate processing time (10-30 seconds)
    const processingTime = Math.random() * 20000 + 10000
    
    setTimeout(async () => {
      try {
        // Simulate success/failure (95% success rate)
        const isSuccess = Math.random() > 0.05

        if (isSuccess) {
          // Update with completed status and mock video URL
          await supabase
            .from('video')
            .update({
              status: 'completed',
              video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              processing_completed_at: new Date().toISOString()
            })
            .eq('id', videoId)
        } else {
          // Update with error status
          await supabase
            .from('video')
            .update({
              status: 'failed',
              error_message: 'Error creating video. Please try again.',
              processing_completed_at: new Date().toISOString()
            })
            .eq('id', videoId)
        }

        // Clear active video from chat
        const { data: video } = await supabase
          .from('video')
          .select('chat_id')
          .eq('id', videoId)
          .single()

        if (video) {
          await supabase
            .from('chat')
            .update({
              active_video_id: null,
              last_activity_at: new Date().toISOString()
            })
            .eq('id', video.chat_id)
        }
      } catch (error) {
        console.error('Error completing video processing:', error)
      }
    }, processingTime)
  } catch (error) {
    console.error('Error processing video:', error)
  }
}

/**
 * Cancel video generation
 * @param {string} videoId - Video ID to cancel
 * @param {string} userId - User ID
 * @param {string} reason - Cancellation reason
 */
export const cancelVideoGeneration = async (videoId, userId, reason = 'Cancelled by user') => {
  try {
    const { data: video, error } = await supabase
      .from('video')
      .update({
        status: 'cancelled',
        cancelled_by: userId,
        cancellation_reason: reason,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', videoId)
      .select()
      .single()

    if (error) throw error

    // Clear active video from chat
    if (video.chat_id) {
      await supabase
        .from('chat')
        .update({
          active_video_id: null,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', video.chat_id)
    }

    // Refund credits if processing hadn't really started
    if (video.status === 'queued' || video.status === 'processing') {
      const { error: refundError } = await supabase.rpc('add_user_credits', {
        user_id: userId,
        credits_to_add: video.credits_used || 10
      })

      if (refundError) {
        console.error('Error refunding credits:', refundError)
      }
    }

    return video
  } catch (error) {
    console.error('Error cancelling video generation:', error)
    throw error
  }
}

/**
 * Get video generation status
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Video status
 */
export const getVideoStatus = async (videoId) => {
  try {
    const { data: video, error } = await supabase
      .from('video')
      .select('id, status, processing_started_at, processing_completed_at, error_message, video_url')
      .eq('id', videoId)
      .single()

    if (error) throw error
    return video
  } catch (error) {
    console.error('Error getting video status:', error)
    throw error
  }
}