import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from './ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Link } from 'react-router-dom'
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { useDispatch, useSelector } from 'react-redux'
import Comment from './Comment'
import axios from 'axios'
import { toast } from 'sonner'
import { setPosts, setSelectedPost } from '@/redux/postSlice'

const CommentDialog = ({ open, setOpen }) => {
  const [text, setText] = useState("");
  const { selectedPost, posts } = useSelector(store => store.post);
  const [comment, setComment] = useState([]);
   const { user } = useSelector(store => store.auth);
  const dispatch = useDispatch();
 const url = import.meta.env.VITE_URL || 'http://localhost:5000';
 
  // Helpers to navigate between posts in the dialog
  const currentIndex = selectedPost ? posts.findIndex(p => p._id === selectedPost._id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < posts.length - 1;

  const goToAdjacentPost = (direction) => {
    if (!posts?.length || !selectedPost) return;
    const idx = posts.findIndex(p => p._id === selectedPost._id);
    if (idx === -1) return;
    const newIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= posts.length) return;
    const newPost = posts[newIdx];
    // Update selected post in redux so the rest of the app is in sync
    dispatch(setSelectedPost(newPost));
    // Also update local comment list immediately
    setComment(newPost.comments || []);
  }
  useEffect(() => {
    if (selectedPost) {
      setComment(selectedPost.comments);
    }
  }, [selectedPost]);

  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    if (inputText.trim()) {
      setText(inputText);
    } else {
      setText("");
    }
  }

  const sendMessageHandler = async () => {

    try {
      const res = await axios.post(`${url}/api/v1/post/${selectedPost?._id}/comment`, { text }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (res.data.success) {
        const updatedCommentData = [...comment, res.data.comment];
        setComment(updatedCommentData);

        const updatedPostData = posts.map(p =>
          p._id === selectedPost._id ? { ...p, comments: updatedCommentData } : p
        );
        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
        setText("");
      }
    } catch (error) {
      console.log(error);
    }
  }
const deletePostHandler = async () => {
  try {
    const res = await axios.delete(`${url}/api/v1/post/delete/${selectedPost?._id}`, { withCredentials: true });

    if (res.data.success) {
      const updatedPostData = posts.filter((postItem) => postItem?._id !== selectedPost?._id);
      dispatch(setPosts(updatedPostData));
      toast.success(res.data.message);
    }
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message || "Something went wrong");
  }
};

     const SPECIAL_USER_ID = import.meta.env.VITE_SPECIAL_USER_ID || '68d37e416d154171a2ebc9e7';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl p-0.5 transform scale-125 flex flex-col">
        <DialogTitle className="sr-only">Post comments</DialogTitle>
        <DialogDescription className="sr-only">View and add comments to the post</DialogDescription>
        {/* this oniniteractoutside is a method which prevent clicking outside */}
        <div className='flex flex-1 relative'>
          {/* Left / Right navigation buttons */}
          <Button
            variant="ghost"
            onClick={() => goToAdjacentPost('left')}
            disabled={!hasPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2"
            aria-label="Previous post"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            onClick={() => goToAdjacentPost('right')}
            disabled={!hasNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2"
            aria-label="Next post"
          >
            <ChevronRight />
          </Button>
          <div className='w-1/2'>
            <img
              src={selectedPost?.image}
              alt="post_img"
              className='w-full h-full object-cover rounded-l-lg'
            />
          </div>
          <div className='w-1/2 flex flex-col justify-between'>
            <div className='flex items-center justify-between p-4'>
              <div className='flex gap-3 items-center'>
                <Link>
                  <Avatar>
                    <AvatarImage src={selectedPost?.author?.profilePicture} />
                    <AvatarFallback>  <img src={selectedPost?.author?.profilePicture || '/profile.jpeg'} alt="default" className="w-full h-full object-cover" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link className='font-semibold text-xs'>{selectedPost?.author?.username}</Link>
                  {/* <span className='text-gray-600 text-sm'>Bio here...</span> */}
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <MoreHorizontal className='cursor-pointer' />
                </DialogTrigger>
                <DialogContent className="flex flex-col items-center text-sm text-center">
                  <DialogTitle className="sr-only">Post options</DialogTitle>
                  <DialogDescription className="sr-only">Actions for this post</DialogDescription>
                  <div className='cursor-pointer w-full text-[#ED4956] font-bold'>
                    Unfollow
                  </div>
                  <div className='cursor-pointer w-full'>
                    Add to favorites
                  </div>
                 {
                           (user && (user?._id === selectedPost?.author?._id || user?._id === SPECIAL_USER_ID))
 && (
                                            <Button onClick={deletePostHandler} variant='ghost' className="cursor-pointer w-fit">Delete</Button>
                                            )
                                        }
                </DialogContent>
              </Dialog>
            </div>
            <hr />
            <div className='flex-1 overflow-y-auto max-h-96 p-4'>
              {
                comment.map((comment) => <Comment key={comment._id} comment={comment} />)
              }
            </div>
            <div className='p-4'>
              <div className='flex items-center gap-2'>
                <input type="text" value={text} onChange={changeEventHandler} placeholder='Add a comment...' className='w-full outline-none border text-sm border-gray-300 p-2 rounded' />
                <Button disabled={!text.trim()} onClick={sendMessageHandler} variant="outline">Send</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CommentDialog
