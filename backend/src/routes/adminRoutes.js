import express from "express";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import { createUser, getAllUsers, deleteUser ,uploadPdfs ,getAllPdfs , deletePdf , getDashboardStats,createCourse ,getAllCourses} from "../controllers/adminController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Only admin can access these routes
router.use(protect);
router.use(authorize("admin"));

// Create a user
router.post("/create-user", createUser);

// Get all users
router.get("/users", getAllUsers);

// Delete a user
router.delete("/user/:role/:id", deleteUser);

//upload pdf function
router.post(
    "/pdfs",
    upload.fields([
        { name: 'questionPaper', maxCount: 1 },
        { name: 'solutionPaper', maxCount: 1 }
    ]),
    uploadPdfs
);

// Get all PDFs
router.get("/pdfs", getAllPdfs);

// Delete a PDF
router.delete("/pdfs/:id", deletePdf);

router.get("/dashboard-stats", protect, authorize('admin'), getDashboardStats)

router.post('/courses', createCourse);

router.get('/courses', getAllCourses);

export default router;
