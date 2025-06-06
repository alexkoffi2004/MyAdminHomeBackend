const Request = require('../models/Request');

// @desc    Get citizen statistics
// @route   GET /api/citizen/statistics
// @access  Private
exports.getCitizenStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all requests for the user
    const requests = await Request.find({ user: userId });

    // Calculate statistics
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(req => req.status === 'pending').length;
    const processingRequests = requests.filter(req => req.status === 'processing').length;
    const completedRequests = requests.filter(req => req.status === 'completed').length;
    const rejectedRequests = requests.filter(req => req.status === 'rejected').length;

    // Calculate payment statistics
    const totalPayments = requests.reduce((sum, req) => sum + (req.price || 0), 0);
    const pendingPayments = requests
      .filter(req => req.paymentStatus === 'pending')
      .reduce((sum, req) => sum + (req.price || 0), 0);
    const completedPayments = requests
      .filter(req => req.paymentStatus === 'completed')
      .reduce((sum, req) => sum + (req.price || 0), 0);

    // Calculate trends (comparing with last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthRequests = await Request.find({
      user: userId,
      createdAt: { $gte: lastMonth }
    });

    const lastMonthCompleted = lastMonthRequests.filter(req => req.status === 'completed').length;
    const currentMonthCompleted = completedRequests;

    const completedTrend = {
      value: lastMonthCompleted === 0 ? 100 : ((currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100,
      isPositive: currentMonthCompleted >= lastMonthCompleted
    };

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        processingRequests,
        completedRequests,
        rejectedRequests,
        totalPayments,
        pendingPayments,
        completedPayments,
        trends: {
          requests: {
            value: 0, // TODO: Implement request trend calculation
            isPositive: true
          },
          completed: completedTrend
        }
      }
    });
  } catch (error) {
    console.error('Error in getCitizenStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
}; 