export const translations = {
  en: {
    // === Sidebar & Layout ===
    sidebar: {
      subjects: 'Subjects',
      examHistory: 'Exam History',
      bookmarks: 'Bookmarks',
      adminAccess: 'Admin Access',
      language: 'Language',
      administrator: 'Administrator',
      guestMode: 'Guest Mode',
      student: 'Student',
    },
    topHeader: {
      signOut: 'Sign Out',
      signIn: 'Sign In',
      confirmSignOut: 'Are you sure you want to sign out?',
    },

    // === Login Page ===
    login: {
      brand: 'FPTU Learning & Review Platform',
      welcome: 'Welcome Back!',
      subtitle: 'Sign in to sync your progress across devices',
      google: 'Sign in with Google',
      or: 'or',
      guest: 'Continue as Guest',
      guestNote: 'Guest accounts have limited features. Your exam history and bookmarks will not be saved across sessions.',
      footer: 'FPTU Education Platform',
    },

    // === Subject Selection ===
    subjects: {
      module: 'Module',
      masterDesc: (sub) => `Master the fundamentals and advanced topics of ${sub}.`,
      startLearning: 'Start Learning',
      lockedAlert: 'This course is temporarily locked by the Admin.',
      lockedByAdmin: 'Locked by Admin',
    },

    // === Mode Selection ===
    mode: {
      courseId: 'Course ID',
      selectPath: 'Select Mastery',
      pathHighlight: 'Path',
      description: (sub) => `Choose how you want to interact with the ${sub} module. Study mode for learning, Practice for drilling, and Exam for evaluation.`,
      studyMode: 'Study Mode',
      studyDesc: 'Read through questions and answers sequentially. Perfect for initial learning and understanding concepts.',
      practiceMode: 'Practice Mode',
      practiceDesc: 'Test your knowledge immediately. Get instant feedback on your answers and learn from your mistakes securely.',
      mockExam: 'Mock Exam',
      examDesc: 'Simulate a real testing environment. Time limits, question randomization, and comprehensive result analysis.',
      configureSetup: 'Configure Setup',
      setup: 'Setup',
      timeLimit: 'Time Limit (15-60 Mins)',
      numQuestions: 'Number of Questions (20-100)',
      sourceFilter: 'Source Filter',
      sourceFilterNote: '(Select specific terms or Bookmarks)',
      savedOnly: 'SAVED / BOOKMARKED ONLY',
      launch: 'Launch',
      noBookmarksAlert: "You don't have any bookmarked questions for this subject!",
      selectTermAlert: 'Please select at least one semester term.',
      noQuestionsAlert: 'No questions found.',
    },

    // === Study Session ===
    study: {
      question: 'Question',
      report: 'Report',
      exit: 'Exit',
    },

    // === Practice Session ===
    practice: {
      practice: 'Practice',
      report: 'Report',
      exit: 'Exit',
      confirmSelection: 'Confirm Selection',
    },

    // === Active Exam ===
    exam: {
      liveExam: 'Live Exam Session',
      mockExam: 'Mock Exam',
      questionNav: 'Question Navigator',
      gridView: 'Grid View',
      answered: 'Answered',
      unanswered: 'Unanswered',
      submitExam: 'Submit Exam',
      submitConfirm: 'Submitting early! Are you sure?',
      previous: 'Previous',
      questionOf: (cur, total) => `Question ${cur} of ${total}`,
      finishExam: 'Finish Exam',
      nextQuestion: 'Next Question',
    },

    // === Exam Result ===
    result: {
      performanceAnalytics: 'Performance Analytics',
      moduleReport: 'Module Final Report',
      viewHistory: 'View History',
      backToSubjects: 'Back to Subjects',
      tryAgain: 'Try Again',
      totalScore: 'Total Score',
      accuracyDetails: 'Accuracy Details',
      correct: 'Correct',
      timeEfficiency: 'Time Efficiency',
      avgPerQuestion: (avg) => `Avg. ${avg}s per question`,
      reviewAnswers: 'Review Answers',
      hideReview: 'Hide Review',
      correctLabel: 'Correct',
      incorrectLabel: 'Incorrect',
    },

    // === Exam History ===
    history: {
      title: 'Performance Log',
      subtitle: 'Review your past mock exams to track progress over time.',
      noHistory: 'No History Yet',
      noHistoryDesc: 'Complete a mock exam to see your results here.',
      mockExam: 'Mock Exam',
      correct: 'Correct',
    },

    // === Bookmarks ===
    bookmarks: {
      title: 'Saved Questions',
      subtitle: 'Your personalized collection categorized by subject for efficient learning.',
      noBookmarks: 'No Bookmarks',
      noBookmarksDesc: 'Questions you star during study or practice will appear here.',
      all: 'All',
      review: 'Review',
      allOptions: 'All Options',
    },
  },

  vi: {
    // === Sidebar & Layout ===
    sidebar: {
      subjects: 'Môn học',
      examHistory: 'Lịch sử thi',
      bookmarks: 'Đã lưu',
      adminAccess: 'Quản trị',
      language: 'Ngôn ngữ',
      administrator: 'Quản trị viên',
      guestMode: 'Chế độ Khách',
      student: 'Sinh viên',
    },
    topHeader: {
      signOut: 'Đăng xuất',
      signIn: 'Đăng nhập',
      confirmSignOut: 'Bạn có chắc muốn đăng xuất không?',
    },

    // === Login Page ===
    login: {
      brand: 'Nền tảng Học tập & Ôn thi FPTU',
      welcome: 'Chào mừng trở lại!',
      subtitle: 'Đăng nhập để đồng bộ tiến trình học trên mọi thiết bị',
      google: 'Đăng nhập bằng Google',
      or: 'hoặc',
      guest: 'Tiếp tục với tư cách Khách',
      guestNote: 'Tài khoản khách có tính năng hạn chế. Lịch sử thi và bookmark sẽ không được lưu khi đóng phiên.',
      footer: 'Nền tảng Giáo dục FPTU',
    },

    // === Subject Selection ===
    subjects: {
      module: 'Môn học',
      masterDesc: (sub) => `Nắm vững kiến thức cơ bản và nâng cao của ${sub}.`,
      startLearning: 'Bắt đầu học',
      lockedAlert: 'Khóa học này đang tạm thời bị khóa bởi Quản trị viên.',
      lockedByAdmin: 'Đã bị khóa',
    },

    // === Mode Selection ===
    mode: {
      courseId: 'Mã môn học',
      selectPath: 'Chọn phương thức',
      pathHighlight: 'Học tập',
      description: (sub) => `Chọn cách bạn muốn tương tác với môn ${sub}. Chế độ Học để nắm bài, Luyện tập để rèn luyện, và Thi thử để đánh giá.`,
      studyMode: 'Chế độ Học',
      studyDesc: 'Đọc qua câu hỏi và đáp án theo thứ tự. Phù hợp cho việc học ban đầu và hiểu khái niệm.',
      practiceMode: 'Chế độ Luyện tập',
      practiceDesc: 'Kiểm tra kiến thức ngay lập tức. Nhận phản hồi tức thì về câu trả lời và học từ lỗi sai.',
      mockExam: 'Thi thử',
      examDesc: 'Mô phỏng môi trường thi thực tế. Giới hạn thời gian, trộn câu hỏi ngẫu nhiên, và phân tích kết quả toàn diện.',
      configureSetup: 'Thiết lập',
      setup: 'Thiết lập',
      timeLimit: 'Thời gian (15-60 phút)',
      numQuestions: 'Số câu hỏi (20-100)',
      sourceFilter: 'Bộ lọc nguồn',
      sourceFilterNote: '(Chọn kỳ cụ thể hoặc Bookmark)',
      savedOnly: 'CHỈ CÂU HỎI ĐÃ LƯU',
      launch: 'Bắt đầu',
      noBookmarksAlert: 'Bạn chưa có câu hỏi bookmark nào cho môn này!',
      selectTermAlert: 'Vui lòng chọn ít nhất một kỳ học.',
      noQuestionsAlert: 'Không tìm thấy câu hỏi.',
    },

    // === Study Session ===
    study: {
      question: 'Câu hỏi',
      report: 'Báo cáo',
      exit: 'Thoát',
    },

    // === Practice Session ===
    practice: {
      practice: 'Luyện tập',
      report: 'Báo cáo',
      exit: 'Thoát',
      confirmSelection: 'Xác nhận',
    },

    // === Active Exam ===
    exam: {
      liveExam: 'Phiên thi đang diễn ra',
      mockExam: 'Thi thử',
      questionNav: 'Bảng câu hỏi',
      gridView: 'Dạng lưới',
      answered: 'Đã trả lời',
      unanswered: 'Chưa trả lời',
      submitExam: 'Nộp bài',
      submitConfirm: 'Nộp bài sớm! Bạn có chắc không?',
      previous: 'Trước',
      questionOf: (cur, total) => `Câu ${cur} / ${total}`,
      finishExam: 'Kết thúc thi',
      nextQuestion: 'Câu tiếp theo',
    },

    // === Exam Result ===
    result: {
      performanceAnalytics: 'Phân tích kết quả',
      moduleReport: 'Báo cáo cuối kỳ',
      viewHistory: 'Xem lịch sử',
      backToSubjects: 'Quay lại Môn học',
      tryAgain: 'Làm lại',
      totalScore: 'Tổng điểm',
      accuracyDetails: 'Chi tiết độ chính xác',
      correct: 'Đúng',
      timeEfficiency: 'Hiệu suất thời gian',
      avgPerQuestion: (avg) => `TB ${avg}s / câu`,
      reviewAnswers: 'Xem đáp án',
      hideReview: 'Ẩn đáp án',
      correctLabel: 'Đúng',
      incorrectLabel: 'Sai',
    },

    // === Exam History ===
    history: {
      title: 'Nhật ký kết quả',
      subtitle: 'Xem lại các bài thi thử trước để theo dõi tiến trình.',
      noHistory: 'Chưa có lịch sử',
      noHistoryDesc: 'Hoàn thành một bài thi thử để xem kết quả tại đây.',
      mockExam: 'Thi thử',
      correct: 'Đúng',
    },

    // === Bookmarks ===
    bookmarks: {
      title: 'Câu Hỏi Đã Lưu',
      subtitle: 'Bộ sưu tập cá nhân được phân loại theo môn học để ôn tập hiệu quả.',
      noBookmarks: 'Chưa Có Bookmark',
      noBookmarksDesc: 'Các câu hỏi bạn đánh dấu sao trong khi học hoặc luyện tập sẽ xuất hiện ở đây.',
      all: 'Tất cả',
      review: 'Ôn tập',
      allOptions: 'Tất Cả Đáp Án',
    },
  }
}

export const getTranslations = (language) => {
  return translations[language] || translations.en
}
