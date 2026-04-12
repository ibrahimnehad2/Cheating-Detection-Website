// backend/scheduler.js
const cron = require("node-cron");
const Teacher = require("./models/Teacher"); // Adjust the path if needed
const mongoose = require("mongoose");

// This function sets up a cron job that runs every 1 minute
function setupExamPublisher() {
  // "*/1 * * * *" => every minute
  cron.schedule("*/1 * * * *", async () => {
    try {
      const now = new Date();
      console.log("Cron job: checking if any exams need to be published at", now.toString());

      // 1) load all teachers
      const teachers = await Teacher.find({});

      let changedCount = 0;

      // 2) For each teacher => for each exam
      for (const teacher of teachers) {
        let changed = false;
        for (const course of teacher.courses) {
          for (const exam of course.exams) {
            // if exam not published and exam.startDate <= now => publish it
            if (exam.published === false && exam.startDate && exam.startDate <= now) {
              exam.published = true;
              changed = true;
              changedCount++;
              console.log(
                `Publishing exam "${exam.title}" for teacher ${teacher.teacher_id}, startDate was ${exam.startDate}`
              );
            }
          }
        }
        // if we changed any exam in this teacher doc => save
        if (changed) {
          await teacher.save();
        }
      }

      if (changedCount > 0) {
        console.log(`Cron job: published ${changedCount} exam(s).`);
      } else {
        console.log("Cron job: no exams to publish this minute.");
      }
    } catch (err) {
      console.error("Cron job error:", err);
    }
  });
}

module.exports = { setupExamPublisher };
