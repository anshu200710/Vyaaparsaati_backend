import User from '../models/User.js';

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({}, { password: 0 }).skip(skip).limit(limit);
        const total = await User.countDocuments();

        res.json({
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Get user by ID (Admin or self)
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id, { password: 0 });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                error: 'Valid role is required (user or admin)' 
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        user.role = role;
        await user.save();

        res.json({
            message: 'User role updated successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json({
            message: 'User deleted successfully',
            data: user
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId, { password: 0 });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};
