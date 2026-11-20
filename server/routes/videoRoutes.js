import express from "express";
import Video from "../models/Video.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const videos = await Video.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(videos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const { title, topic, status, hooks, script, brollIdeas, visuals} = req.body;

        if (!title || !topic){
            return res.status(400).json({ message: 'Title and topic are required' });
        }

        const video = await Video.create({
            user: req.user._id,
            title,
            topic,
            status: status || 'Scripting',
            hooks: hooks || [],
            script: script || '',
            brollIdeas: brollIdeas || [],
            visuals: visuals || [],
        });
        res.status(201).json(video);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

router.put('/:id', async (req, res) => {
    try {
        const video = await Video.findOne({ _id: req.params.id, user: req.user._id });
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        const updatedVideo = await Video.findByIdAndUpdate(req.params.id, req.body, {returnDocument: 'after', runValidators: true});

        res.json(updatedVideo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.json({ message: 'Video deleted successfully', id: req.params.id });
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;