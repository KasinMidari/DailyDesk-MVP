import { useAuth0 } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  const { loginWithRedirect } = useAuth0();

  const features = [
    {
      image: "https://placehold.co/100x100/3b82f6/white?text=Boards",
      title: "Boards",
      description: "Tổ chức mọi thứ với Kanban boards linh hoạt"
    },
    {
      image: "https://placehold.co/100x100/3b82f6/white?text=Teams",
      title: "Teams",
      description: "Cộng tác với team hiệu quả hơn"
    },
    {
      image: "https://placehold.co/100x100/3b82f6/white?text=AI",
      title: "AI Assistant",
      description: "Trợ lý AI hỗ trợ 24/7"
    },
    {
      image: "https://placehold.co/100x100/3b82f6/white?text=Remind",
      title: "Reminders",
      description: "Không bỏ lỡ deadline nào"
    }
  ];

  const benefits = [
    {
      title: "A productivity powerhouse",
      description: "Integrate the apps your team already uses directly into your workflow.",
      image: "https://placehold.co/600x400/3b82f6/white?text=Productivity"
    },
    {
      title: "Always in sync",
      description: "No matter where you are, DailyDesk stays in sync across all your devices.",
      image: "https://placehold.co/600x400/8b5cf6/white?text=Sync"
    },
    {
      title: "Built for teams",
      description: "Invite your team to boards and collaborate on everything from planning to execution.",
      image: "https://placehold.co/600x400/ec4899/white?text=Teams"
    }
  ];

  const workflowSteps = [
    {
      image: "https://placehold.co/200x200/4f46e5/white?text=Create",
      title: "Tạo Board",
      description: "Bắt đầu với một board mới cho dự án hoặc quy trình làm việc của bạn"
    },
    {
      image: "https://placehold.co/200x200/4f46e5/white?text=Add",
      title: "Thêm Lists & Cards",
      description: "Tổ chức công việc thành lists và cards với mô tả chi tiết"
    },
    {
      image: "https://placehold.co/200x200/4f46e5/white?text=Invite",
      title: "Mời Team",
      description: "Chia sẻ board với đồng nghiệp và phân công công việc"
    },
    {
      image: "https://placehold.co/200x200/4f46e5/white?text=Track",
      title: "Theo dõi tiến độ",
      description: "Xem tổng quan và hoàn thành mục tiêu của bạn"
    }
  ];

  const useCases = [
    {
      image: "https://placehold.co/100x100/0ea5e9/white?text=Project",
      title: "Project Management",
      description: "Quản lý dự án từ ý tưởng đến hoàn thành",
      color: "from-blue-500 to-cyan-500"
    },
    {
      image: "https://placehold.co/100x100/d946ef/white?text=Sprint",
      title: "Sprint Planning",
      description: "Lập kế hoạch sprint và theo dõi backlog",
      color: "from-purple-500 to-pink-500"
    },
    {
      image: "https://placehold.co/100x100/22c55e/white?text=Task",
      title: "Task Management",
      description: "Quản lý công việc hàng ngày hiệu quả",
      color: "from-green-500 to-emerald-500"
    },
    {
      image: "https://placehold.co/100x100/f97316/white?text=Goal",
      title: "Goal Tracking",
      description: "Đặt và theo dõi mục tiêu cá nhân/team",
      color: "from-orange-500 to-red-500"
    }
  ];

  const advancedFeatures = [
    {
      image: "https://placehold.co/100x100/8b5cf6/white?text=AI",
      title: "AI-Powered Assistant",
      description: "Trợ lý AI giúp bạn tối ưu hóa workflow, tự động phân loại task và đề xuất thông minh dựa trên lịch sử làm việc."
    },
    {
      image: "https://placehold.co/100x100/8b5cf6/white?text=Realtime",
      title: "Real-time Collaboration",
      description: "Cập nhật tức thời với Server-Sent Events. Xem thay đổi từ đồng nghiệp ngay lập tức, không cần reload."
    },
    {
      image: "https://placehold.co/100x100/8b5cf6/white?text=Notify",
      title: "Smart Notifications",
      description: "Nhận thông báo qua email khi có deadline sắp tới hoặc khi được mention. Tùy chỉnh tần suất theo ý muốn."
    },
    {
      image: "https://placehold.co/100x100/8b5cf6/white?text=Recur",
      title: "Recurring Tasks",
      description: "Tạo task lặp lại tự động theo chu kỳ ngày/tuần/tháng. Tiết kiệm thời gian cho công việc định kỳ."
    },
    {
      image: "https://placehold.co/100x100/8b5cf6/white?text=Time",
      title: "Time Tracking",
      description: "Theo dõi thời gian làm việc trên từng task, phân tích hiệu suất và tối ưu hóa quy trình."
    },
    {
      image: "https://placehold.co/100x100/8b5cf6/white?text=Flow",
      title: "Custom Workflows",
      description: "Tạo workflow riêng với automation rules, checklist templates và board templates sẵn có."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-600 via-purple-500 to-pink-400">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DailyDesk
                </span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <button className="text-sm font-medium text-gray-700 hover:text-gray-900">Features</button>
                <button className="text-sm font-medium text-gray-700 hover:text-gray-900">Solutions</button>
                <button className="text-sm font-medium text-gray-700 hover:text-gray-900">Pricing</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => loginWithRedirect()}
                className="font-medium"
              >
                Log in
              </Button>
              <Button 
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}
                className="bg-blue-600 hover:bg-blue-700 font-mediumdaily text-white hover:cursor-pointer"
              >
                Get DailyDesk for free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            DailyDesk brings all your tasks, teammates, and tools together
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Keep everything in the same place—even if your team isn't.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            
            <Button 
              size="lg"
              onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}
              className="hover:cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-base font-medium w-full sm:w-auto"
            >
              Sign up - it's free!
            </Button>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="relative mx-auto max-w-5xl">
            <div className="bg-white rounded-lg shadow-2xl p-6 backdrop-blur-sm">
              <img 
                src="https://images.prismic.io/friday-marketing/e15e8faf-bc7f-4828-af6b-31dd0cf98ae8_Trello.png?auto=compress,format" 
                alt="Dashboard Preview" 
                className="w-full rounded-lg shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Introduction Section */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <span className="text-lg">✨</span>
              <span className="text-sm font-semibold text-blue-700">GIỚI THIỆU SẢN PHẨM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              DailyDesk là gì?
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              DailyDesk là nền tảng quản lý công việc thế hệ mới, kết hợp sức mạnh của Kanban boards 
              với công nghệ AI tiên tiến. Được thiết kế cho cả cá nhân và team, DailyDesk giúp bạn 
              tổ chức mọi thứ từ task đơn giản đến dự án phức tạp một cách trực quan và hiệu quả.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-gray-600">Free to Start</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
                <div className="text-gray-600">Unlimited Boards</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cách hoạt động
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chỉ với 4 bước đơn giản, bạn đã có thể bắt đầu quản lý công việc chuyên nghiệp
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {workflowSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {index + 1}
                    </div>
                    <div className="w-14 h-14 rounded-xl overflow-hidden mb-6 mt-4">
                      <img src={step.image} alt={step.title} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Phù hợp với mọi nhu cầu
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Từ quản lý dự án đến task cá nhân, DailyDesk là giải pháp toàn diện
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden bg-white rounded-2xl border-2 border-gray-200 hover:border-transparent transition-all hover:shadow-2xl p-8"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className={`w-12 h-12 rounded-xl mb-4 overflow-hidden`}>
                  <img src={useCase.image} alt={useCase.title} className="w-full h-full object-cover rounded-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-6 border border-gray-200">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold text-gray-700">TÍNH NĂNG NỔI BẬT</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Công nghệ hiện đại, trải nghiệm vượt trội
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DailyDesk không chỉ là một công cụ quản lý task đơn thuần. Chúng tôi tích hợp 
              những công nghệ tiên tiến nhất để mang đến trải nghiệm làm việc tuyệt vời.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-200"
              >
                <div className="w-14 h-14 rounded-xl mb-6 shadow-lg overflow-hidden">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover rounded-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              A productivity powerhouse
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, flexible, and powerful. All it takes are boards, lists, and cards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center p-6"
              >
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 overflow-hidden shadow-md">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-24">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
              >
                <div className="flex-1">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    {benefit.title}
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 text-center overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                    <img src={benefit.image} alt={benefit.title} className="w-full h-auto rounded-lg shadow-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">2M+</div>
              <div className="text-xl opacity-90">Teams worldwide</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.99%</div>
              <div className="text-xl opacity-90">Uptime guarantee</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">Unlimited</div>
              <div className="text-xl opacity-90">Boards & tasks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Join millions of people who organize work with DailyDesk
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-50 rounded-xl p-8">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "DailyDesk has transformed how our team collaborates. It's simple yet powerful."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-gray-900">User {item}</div>
                    <div className="text-sm text-gray-600">Team Lead</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Sign up and get started today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            A board is the perfect place to stay on top of everything. It's where tasks get done.
          </p>
          <Button 
            size="lg"
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}
            className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold shadow-xl"
          >
            Get started - it's free!
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">DailyDesk</span>
            </div>
            <div className="flex gap-8 text-sm">
              <button className="hover:text-blue-400 transition-colors">About</button>
              <button className="hover:text-blue-400 transition-colors">Careers</button>
              <button className="hover:text-blue-400 transition-colors">Blog</button>
              <button className="hover:text-blue-400 transition-colors">Help</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl">🌐</span>
              <span className="text-sm">© 2026 DailyDesk</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
