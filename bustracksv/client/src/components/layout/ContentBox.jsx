const ContentBox = ({ data }) => {
  const { title, introParagraph, mission, vision, values } = data;

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 max-w-6xl mx-auto shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Main Title */}
      <h1 className="text-2xl md:text-3xl text-text-primary mb-3">
        {title}
      </h1>
      
      {/* Decorative Underline */}
      <div className="w-24 h-1.5 bg-accent-light-blue mb-4 rounded-sm"></div>
      
      {/* Introductory Paragraph */}
      <p className="text-text-primary text-sm md:text-base mb-6 leading-relaxed">
        {introParagraph}
      </p>
      
      {/* Content Sections */}
      <div className="space-y-6">
        {/* Mission Section */}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
            {mission.title}
          </h2>
          <p className="text-text-primary text-sm md:text-base leading-relaxed">
            {mission.text}
          </p>
        </div>
        
        {/* Vision Section */}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">
            {vision.title}
          </h2>
          <p className="text-text-primary text-sm md:text-base leading-relaxed">
            {vision.text}
          </p>
        </div>
        
        {/* Values Section */}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-3">
            {values.title}
          </h2>
          <ul className="space-y-3">
            {values.list.map((value, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent-blue rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-text-primary text-sm md:text-base leading-relaxed">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContentBox;
