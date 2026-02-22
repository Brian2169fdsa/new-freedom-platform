// Mock content for all 12 steps with 3-4 lessons each.
// Based on traditional 12-step recovery program principles,
// aligned with Joe McDonald's curriculum at New Freedom AZ.

export interface LessonContent {
  readonly id: string;
  readonly lessonNumber: number;
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly contentBlocks: readonly string[];
  readonly reflectionPrompts: readonly string[];
  readonly keyTakeaways: readonly string[];
}

export interface StepContent {
  readonly stepNumber: number;
  readonly title: string;
  readonly tagline: string;
  readonly principle: string;
  readonly description: string;
  readonly lessons: readonly LessonContent[];
}

const STEP_CONTENT: readonly StepContent[] = [
  {
    stepNumber: 1,
    title: 'Powerlessness',
    tagline: 'Admitting we need help is the first act of courage',
    principle: 'Honesty',
    description:
      'We admitted we were powerless over our addiction - that our lives had become unmanageable.',
    lessons: [
      {
        id: 'step1-lesson1',
        lessonNumber: 1,
        title: 'Understanding Powerlessness',
        estimatedMinutes: 15,
        contentBlocks: [
          'The concept of powerlessness is not about weakness. It is about recognizing that addiction has taken control of areas of our lives that we once managed. Accepting this truth is the starting point of genuine recovery.',
          'Many people resist the idea of being powerless because society tells us we should be in control at all times. But addiction operates differently. It hijacks our decision-making, our relationships, and our health in ways that willpower alone cannot overcome.',
          'Consider the times you tried to stop or moderate on your own. What happened? If you are honest with yourself, you will likely see a pattern of promises broken, boundaries crossed, and consequences ignored. This is not a moral failing; it is the nature of addiction.',
        ],
        reflectionPrompts: [
          'Describe a time when you tried to control your addiction but could not. What happened?',
          'What areas of your life have become unmanageable because of your addiction?',
        ],
        keyTakeaways: [
          'Powerlessness is not weakness - it is honest self-awareness.',
          'Addiction overrides normal decision-making processes.',
          'Recognizing powerlessness opens the door to receiving help.',
        ],
      },
      {
        id: 'step1-lesson2',
        lessonNumber: 2,
        title: 'Unmanageability in Daily Life',
        estimatedMinutes: 12,
        contentBlocks: [
          'Unmanageability shows up in every corner of our lives when addiction takes hold. It is visible in missed appointments, broken promises to loved ones, financial problems, legal troubles, and declining health.',
          'Sometimes unmanageability is subtle. It can look like chronic anxiety, the inability to sleep without substances, isolation from friends and family, or an inability to hold a job. These quieter signs are just as significant as the dramatic ones.',
          'Take an honest inventory of the areas of your life that are not working. This is not about shame or guilt. It is about clarity. When we see the full picture, we understand why we need a new approach.',
        ],
        reflectionPrompts: [
          'List three specific ways your life has become unmanageable.',
          'How has addiction affected your relationships with people you care about?',
        ],
        keyTakeaways: [
          'Unmanageability affects finances, relationships, health, and self-worth.',
          'Subtle signs of unmanageability are as important as dramatic ones.',
          'Honest inventory creates the clarity needed for change.',
        ],
      },
      {
        id: 'step1-lesson3',
        lessonNumber: 3,
        title: 'The Gift of Surrender',
        estimatedMinutes: 10,
        contentBlocks: [
          'Surrender sounds like giving up, but in recovery it means the opposite. Surrender means letting go of the illusion that we can manage addiction on our own and opening ourselves to a new way of living.',
          'Think of it this way: if you were drowning, the worst thing you could do is thrash around. The best thing is to relax and let the lifeguard help you. Surrender is reaching out for the lifeguard instead of fighting the current alone.',
          'When we surrender, we create space for support, guidance, and healing. It is the foundation upon which every other step is built.',
        ],
        reflectionPrompts: [
          'What does surrender mean to you in your own words?',
          'What fears come up when you think about letting go of control?',
        ],
        keyTakeaways: [
          'Surrender is an act of courage, not defeat.',
          'Letting go of control makes room for genuine help.',
          'Step 1 is the foundation for all the steps that follow.',
        ],
      },
    ],
  },
  {
    stepNumber: 2,
    title: 'Higher Power',
    tagline: 'Believing that restoration is possible',
    principle: 'Hope',
    description:
      'Came to believe that a Power greater than ourselves could restore us to sanity.',
    lessons: [
      {
        id: 'step2-lesson1',
        lessonNumber: 1,
        title: 'What Is a Higher Power?',
        estimatedMinutes: 15,
        contentBlocks: [
          'A Higher Power does not have to be a religious concept. It can be anything greater than yourself that you can trust: the recovery community, the wisdom of the group, nature, or a spiritual force you define on your own terms.',
          'The key is willingness to believe that something beyond your individual willpower can help you recover. Many people in active addiction believe they are the only ones who can solve their problems, yet that belief kept them stuck.',
          'This step asks you to crack the door open to hope. You do not need certainty. You only need the willingness to consider that healing is possible through something beyond yourself.',
        ],
        reflectionPrompts: [
          'What does "Higher Power" mean to you right now, even if you are unsure?',
          'Have you ever experienced help from something greater than yourself? Describe it.',
        ],
        keyTakeaways: [
          'A Higher Power can be defined however makes sense to you.',
          'Willingness is more important than certainty.',
          'Opening to help beyond yourself breaks the cycle of self-reliance that fueled addiction.',
        ],
      },
      {
        id: 'step2-lesson2',
        lessonNumber: 2,
        title: 'Restored to Sanity',
        estimatedMinutes: 12,
        contentBlocks: [
          'The phrase "restore us to sanity" implies that addiction led us to insanity. In this context, insanity means repeating the same destructive patterns while expecting different results.',
          'Sanity in recovery means making choices that align with our values and well-being. It means responding to life instead of reacting to cravings. It means building a life we do not need to escape from.',
          'Restoration is a process, not an event. It happens gradually as we practice new habits, build healthy relationships, and trust the recovery process.',
        ],
        reflectionPrompts: [
          'What "insane" patterns did you repeat during active addiction?',
          'What does a "sane" daily life look like to you?',
        ],
        keyTakeaways: [
          'Insanity in addiction means repeating destructive patterns.',
          'Sanity is making choices aligned with your values.',
          'Restoration is gradual and comes through consistent practice.',
        ],
      },
      {
        id: 'step2-lesson3',
        lessonNumber: 3,
        title: 'Building Hope',
        estimatedMinutes: 10,
        contentBlocks: [
          'Hope is the fuel that keeps recovery moving forward. Without hope, the work of recovery feels pointless. With hope, even the hardest days become bearable.',
          'You can build hope by listening to the stories of people who have recovered before you. Their journeys prove that a different life is possible. You are not the exception.',
          'Start small. Hope does not require you to believe everything will be perfect. It only asks you to believe that tomorrow can be better than today.',
        ],
        reflectionPrompts: [
          'What gives you hope right now, even if it is small?',
          'Who in your life or your community inspires hope in you?',
        ],
        keyTakeaways: [
          'Hope is a daily practice, not a one-time feeling.',
          'Other people\'s recovery stories can build your hope.',
          'Small hope is enough to keep moving forward.',
        ],
      },
    ],
  },
  {
    stepNumber: 3,
    title: 'Decision',
    tagline: 'Choosing a new path forward',
    principle: 'Faith',
    description:
      'Made a decision to turn our will and our lives over to the care of God as we understood Him.',
    lessons: [
      {
        id: 'step3-lesson1',
        lessonNumber: 1,
        title: 'The Power of a Decision',
        estimatedMinutes: 14,
        contentBlocks: [
          'Step 3 is about making a conscious decision. It is the bridge between recognizing the problem (Steps 1-2) and taking action (Steps 4-12). Without a decision, awareness remains passive.',
          'This decision does not mean you will never struggle again. It means you are choosing a direction. Like stepping onto a path, you may stumble, but the decision to walk the path is what matters.',
          'Many people find it helpful to think of this step as deciding to follow a guide instead of navigating alone. The guide could be a sponsor, a therapist, a community, or a spiritual practice.',
        ],
        reflectionPrompts: [
          'What does making this decision mean for your daily life?',
          'What are you choosing to let go of by making this decision?',
        ],
        keyTakeaways: [
          'A decision sets the direction even when the path is unclear.',
          'This step bridges awareness and action.',
          'Choosing guidance over self-will is an act of faith.',
        ],
      },
      {
        id: 'step3-lesson2',
        lessonNumber: 2,
        title: 'Turning Over Your Will',
        estimatedMinutes: 12,
        contentBlocks: [
          'Turning over your will means accepting that your best thinking led you to addiction. It is an invitation to try a different approach, guided by wisdom beyond your own.',
          'This does not mean becoming passive. It means aligning your actions with recovery principles rather than impulses. You still make choices, but you make them from a place of intention rather than compulsion.',
          'Practice this daily. Each morning, set an intention to let your Higher Power or recovery principles guide your decisions. At night, reflect on how it went.',
        ],
        reflectionPrompts: [
          'What does "turning over your will" look like in a practical, daily sense?',
          'What decisions in your life are hardest to release control of?',
        ],
        keyTakeaways: [
          'Turning over your will is active, not passive.',
          'It means choosing recovery principles over impulse.',
          'Daily practice strengthens this commitment.',
        ],
      },
      {
        id: 'step3-lesson3',
        lessonNumber: 3,
        title: 'Living the Third Step',
        estimatedMinutes: 10,
        contentBlocks: [
          'Living the Third Step means making this decision fresh every day. Recovery is not a one-time event. It is a daily commitment to a new way of living.',
          'When you face a difficult situation, pause and ask: am I trying to force my will, or am I open to guidance? That pause is the Third Step in action.',
          'Over time, this practice becomes more natural. You begin to trust the process, and the grip of old patterns loosens. Freedom grows in the space between stimulus and response.',
        ],
        reflectionPrompts: [
          'How will you practice the Third Step today?',
          'Describe a recent situation where you could have paused and sought guidance instead of reacting.',
        ],
        keyTakeaways: [
          'The Third Step is renewed each day.',
          'Pausing before reacting is the step in action.',
          'Trust in the process grows with practice.',
        ],
      },
    ],
  },
  {
    stepNumber: 4,
    title: 'Moral Inventory',
    tagline: 'Looking honestly at who we have been',
    principle: 'Courage',
    description:
      'Made a searching and fearless moral inventory of ourselves.',
    lessons: [
      {
        id: 'step4-lesson1',
        lessonNumber: 1,
        title: 'What Is a Moral Inventory?',
        estimatedMinutes: 15,
        contentBlocks: [
          'A moral inventory is an honest, thorough look at your behaviors, resentments, fears, and the harm you have caused and experienced. Think of it as a personal audit, not a punishment.',
          'The purpose is not to beat yourself up. It is to bring hidden patterns into the light so they can be addressed. What stays hidden keeps its power over you.',
          'Many people find it helpful to write their inventory. Use columns for the person or institution, what happened, how it affected you, and your part in it. This structure keeps the process focused.',
        ],
        reflectionPrompts: [
          'What feelings come up when you think about doing a moral inventory?',
          'What do you hope to discover or release through this process?',
        ],
        keyTakeaways: [
          'A moral inventory is an audit, not a punishment.',
          'Hidden patterns lose power when brought into the light.',
          'Structured writing keeps the process focused and manageable.',
        ],
      },
      {
        id: 'step4-lesson2',
        lessonNumber: 2,
        title: 'Examining Resentments and Fears',
        estimatedMinutes: 15,
        contentBlocks: [
          'Resentments are like carrying a heavy backpack filled with old grievances. They drain your energy and keep you anchored to the past. Identifying them is the first step to putting the backpack down.',
          'List the people, institutions, and situations you resent. For each one, note how the resentment affects your self-esteem, security, relationships, and peace of mind.',
          'Fears operate similarly. Fear of rejection, failure, financial insecurity, and abandonment drive many of our destructive behaviors. Naming them reduces their hold on you.',
        ],
        reflectionPrompts: [
          'Who or what do you resent most deeply, and why?',
          'What are your three biggest fears, and how have they influenced your choices?',
        ],
        keyTakeaways: [
          'Resentments drain energy and anchor you to the past.',
          'Naming fears reduces their power.',
          'Both resentments and fears drive addictive behavior.',
        ],
      },
      {
        id: 'step4-lesson3',
        lessonNumber: 3,
        title: 'Recognizing Your Part',
        estimatedMinutes: 12,
        contentBlocks: [
          'This is often the hardest part of the inventory: looking at your own role in conflicts and harm. It requires the "fearless" honesty the step describes.',
          'Recognizing your part does not mean taking all the blame. It means acknowledging where your actions, attitudes, or choices contributed to the situation. Even when others wronged you, understanding your response patterns is valuable.',
          'This process builds self-awareness, which is essential for change. You cannot change what you refuse to see.',
        ],
        reflectionPrompts: [
          'In a conflict from your past, what was your part? Be specific.',
          'What patterns do you notice in your own behavior across different situations?',
        ],
        keyTakeaways: [
          'Recognizing your part is not the same as taking all the blame.',
          'Self-awareness is the prerequisite for lasting change.',
          'Patterns visible in the inventory reveal what needs to change.',
        ],
      },
      {
        id: 'step4-lesson4',
        lessonNumber: 4,
        title: 'Completing Your Inventory',
        estimatedMinutes: 10,
        contentBlocks: [
          'There is no perfect inventory. It does not need to be a literary masterpiece. What matters is honesty and completeness to the best of your ability at this time.',
          'Many people put off Step 4 because it feels overwhelming. Break it into manageable sections. Work on one area or one relationship at a time. Progress, not perfection, is the goal.',
          'When you finish, you will likely feel a mix of relief and vulnerability. That is normal and healthy. You have done courageous work. The next step gives you a safe place to share what you have written.',
        ],
        reflectionPrompts: [
          'What is holding you back from completing your inventory?',
          'How do you feel after writing about your experiences honestly?',
        ],
        keyTakeaways: [
          'Done is better than perfect when it comes to the inventory.',
          'Break the work into manageable sections.',
          'Completing the inventory is an act of courage that prepares you for Step 5.',
        ],
      },
    ],
  },
  {
    stepNumber: 5,
    title: 'Admission',
    tagline: 'Sharing our truth with another person',
    principle: 'Integrity',
    description:
      'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.',
    lessons: [
      {
        id: 'step5-lesson1',
        lessonNumber: 1,
        title: 'Why We Share Our Inventory',
        estimatedMinutes: 12,
        contentBlocks: [
          'Secrets keep us sick. The things we hide carry shame, and shame fuels addiction. Step 5 breaks the cycle of secrecy by inviting us to share our truth with another person.',
          'Sharing your inventory with someone you trust transforms it from a private burden into a shared experience. You discover that you are not uniquely broken; many people carry similar struggles.',
          'Choose someone trustworthy: a sponsor, a counselor, a spiritual advisor, or a mentor. This person should be someone who will listen without judgment and maintain confidentiality.',
        ],
        reflectionPrompts: [
          'What fears do you have about sharing your inventory with another person?',
          'Who in your life could you trust to hear your story?',
        ],
        keyTakeaways: [
          'Secrecy feeds shame, and shame feeds addiction.',
          'Sharing breaks the isolation that keeps us stuck.',
          'Choose a trustworthy listener who maintains confidentiality.',
        ],
      },
      {
        id: 'step5-lesson2',
        lessonNumber: 2,
        title: 'The Practice of Admission',
        estimatedMinutes: 12,
        contentBlocks: [
          'Admission happens in three layers: to your Higher Power, to yourself, and to another person. Each layer deepens the experience.',
          'Admitting to yourself means truly accepting what you have done and what has been done to you. It means dropping the excuses, rationalizations, and minimizations.',
          'Admitting to another person is where the magic happens. When someone hears your worst truths and does not reject you, healing begins. You learn that acceptance does not require perfection.',
        ],
        reflectionPrompts: [
          'What has been hardest to admit to yourself?',
          'How do you think you will feel after sharing your truth with another person?',
        ],
        keyTakeaways: [
          'Admission operates on three levels: Higher Power, self, and another person.',
          'Dropping excuses and rationalizations deepens self-honesty.',
          'Being accepted despite your flaws is deeply healing.',
        ],
      },
      {
        id: 'step5-lesson3',
        lessonNumber: 3,
        title: 'After the Fifth Step',
        estimatedMinutes: 10,
        contentBlocks: [
          'After completing Step 5, many people experience a profound sense of relief. The weight of carrying secrets alone is lifted. Some describe it as feeling lighter or freer for the first time in years.',
          'Take time to sit quietly after sharing. Reflect on what you experienced. Thank the person who listened. Acknowledge the courage it took.',
          'This step builds a foundation of trust - trust in yourself, trust in others, and trust in the recovery process. It prepares you for the active change work of Steps 6 and 7.',
        ],
        reflectionPrompts: [
          'After sharing, what shifted for you emotionally or spiritually?',
          'What did you learn about yourself through this process?',
        ],
        keyTakeaways: [
          'Relief often follows the vulnerability of sharing.',
          'Gratitude for the listener strengthens the connection.',
          'Trust built in Step 5 supports the work ahead.',
        ],
      },
    ],
  },
  {
    stepNumber: 6,
    title: 'Ready for Change',
    tagline: 'Becoming willing to release old patterns',
    principle: 'Willingness',
    description:
      'Were entirely ready to have God remove all these defects of character.',
    lessons: [
      {
        id: 'step6-lesson1',
        lessonNumber: 1,
        title: 'Identifying Character Defects',
        estimatedMinutes: 14,
        contentBlocks: [
          'Character defects are the survival mechanisms that once served you but now harm you. Dishonesty, selfishness, fear, resentment, and people-pleasing are common examples.',
          'These patterns developed for a reason. Perhaps dishonesty protected you in a chaotic household. Perhaps isolation kept you safe from further hurt. Recognizing their origin helps you approach them with compassion rather than shame.',
          'Use your Step 4 inventory as a guide. What patterns appear repeatedly? Those are the defects this step asks you to become willing to release.',
        ],
        reflectionPrompts: [
          'What character defects do you see most clearly in yourself?',
          'How did these patterns serve you in the past, and how do they hurt you now?',
        ],
        keyTakeaways: [
          'Character defects are outdated survival mechanisms.',
          'Understanding their origin fosters compassion for yourself.',
          'Your Step 4 inventory reveals the patterns that need attention.',
        ],
      },
      {
        id: 'step6-lesson2',
        lessonNumber: 2,
        title: 'Becoming Entirely Ready',
        estimatedMinutes: 12,
        contentBlocks: [
          'Becoming "entirely ready" is about willingness, not perfection. You do not need to be 100% eager. You need to be willing to be willing.',
          'Some defects are hard to release because they feel comfortable or even necessary. Fear of what life looks like without them is natural. But staying comfortable in dysfunction is not recovery.',
          'Practice readiness by visualizing who you could become without these patterns. What would your relationships, career, and self-image look like? Let that vision pull you forward.',
        ],
        reflectionPrompts: [
          'Which character defects are you most reluctant to let go of, and why?',
          'What would your life look like if these defects were removed?',
        ],
        keyTakeaways: [
          'Willingness does not require eagerness.',
          'Comfort in dysfunction is not the same as health.',
          'Visualizing your future self builds readiness for change.',
        ],
      },
      {
        id: 'step6-lesson3',
        lessonNumber: 3,
        title: 'Patience in the Process',
        estimatedMinutes: 10,
        contentBlocks: [
          'Character change does not happen overnight. Step 6 is preparation, not instant transformation. Be patient with yourself.',
          'Some defects will diminish quickly once you become willing. Others may take months or years of consistent effort. Both timelines are normal.',
          'The commitment to becoming ready is what matters. Each day you renew that willingness, you are working this step.',
        ],
        reflectionPrompts: [
          'How do you handle impatience with your own growth?',
          'What small signs of change have you already noticed in yourself?',
        ],
        keyTakeaways: [
          'Character change is gradual, not instant.',
          'Renewing willingness daily is working Step 6.',
          'Patience with yourself is part of recovery.',
        ],
      },
    ],
  },
  {
    stepNumber: 7,
    title: 'Humbly Asked',
    tagline: 'Seeking help to become who we are meant to be',
    principle: 'Humility',
    description: 'Humbly asked Him to remove our shortcomings.',
    lessons: [
      {
        id: 'step7-lesson1',
        lessonNumber: 1,
        title: 'Understanding Humility',
        estimatedMinutes: 14,
        contentBlocks: [
          'Humility is not humiliation. It is an accurate view of yourself, neither inflated nor deflated. It means knowing your strengths and your limitations honestly.',
          'In addiction, we often swing between grandiosity (thinking we are invincible) and shame (thinking we are worthless). Humility is the balanced middle ground.',
          'Practicing humility means asking for help when you need it, accepting praise gracefully, and admitting mistakes without spiraling into self-hatred.',
        ],
        reflectionPrompts: [
          'How would you define humility in your own words?',
          'Do you tend more toward grandiosity or shame? How does that show up?',
        ],
        keyTakeaways: [
          'Humility is honest self-assessment, not self-degradation.',
          'It balances grandiosity and shame.',
          'Asking for help is an expression of humility.',
        ],
      },
      {
        id: 'step7-lesson2',
        lessonNumber: 2,
        title: 'Asking for Help',
        estimatedMinutes: 12,
        contentBlocks: [
          'Step 7 involves actively asking your Higher Power or support system to help you change. This can be through prayer, meditation, therapy, or honest conversation.',
          'The act of asking acknowledges that change requires partnership. You bring the willingness; the process provides the tools and support.',
          'Many people find it helpful to have a specific prayer or affirmation for this step. Something as simple as "Help me become the person I am meant to be" can center your daily practice.',
        ],
        reflectionPrompts: [
          'What does asking for help look like for you today?',
          'Write a personal prayer or affirmation for your Step 7 practice.',
        ],
        keyTakeaways: [
          'Asking for help is the action of this step.',
          'Change is a partnership between willingness and support.',
          'A daily prayer or affirmation grounds the practice.',
        ],
      },
      {
        id: 'step7-lesson3',
        lessonNumber: 3,
        title: 'Living with Humility',
        estimatedMinutes: 10,
        contentBlocks: [
          'Humility is not a destination but a practice. Each day brings opportunities to choose humility over ego, service over self-centeredness, and openness over rigidity.',
          'Pay attention to moments when pride or shame pulls you away from balance. Those are invitations to practice Step 7.',
          'As humility grows, so does peace. You stop needing to be right, to be perfect, or to control everything. Life becomes more manageable when you let go of the burden of being more than you are.',
        ],
        reflectionPrompts: [
          'When this week did pride or shame pull you off balance?',
          'How has practicing humility affected your peace of mind?',
        ],
        keyTakeaways: [
          'Humility is an ongoing daily practice.',
          'Pride and shame are signals to return to balance.',
          'Humility reduces the need for control and brings peace.',
        ],
      },
    ],
  },
  {
    stepNumber: 8,
    title: 'Made a List',
    tagline: 'Preparing to heal the relationships we have harmed',
    principle: 'Brotherly Love',
    description:
      'Made a list of all persons we had harmed, and became willing to make amends to them all.',
    lessons: [
      {
        id: 'step8-lesson1',
        lessonNumber: 1,
        title: 'Who Have We Harmed?',
        estimatedMinutes: 14,
        contentBlocks: [
          'Step 8 asks you to make a list of all people you have harmed. This includes family members, friends, coworkers, romantic partners, and even yourself.',
          'Harm takes many forms: broken promises, financial damage, emotional neglect, dishonesty, manipulation, and absence. Be thorough in your list.',
          'This step is separate from making amends (that comes in Step 9). Right now, you are simply listing the people and becoming willing to address the harm.',
        ],
        reflectionPrompts: [
          'Who comes to mind first when you think about people you have harmed?',
          'Are there people on your list that surprise you?',
        ],
        keyTakeaways: [
          'Include all forms of harm: emotional, financial, physical, and relational.',
          'Do not forget to include yourself on the list.',
          'This step is about listing and willingness, not yet about action.',
        ],
      },
      {
        id: 'step8-lesson2',
        lessonNumber: 2,
        title: 'Becoming Willing',
        estimatedMinutes: 12,
        contentBlocks: [
          'Willingness to make amends does not mean you are ready to do it right now. It means you are opening your heart to the possibility of healing these relationships.',
          'Some names on your list may bring up strong emotions: anger, guilt, shame, or fear. That is expected. Work through these feelings with your sponsor or counselor before moving to Step 9.',
          'For people who have also harmed you, willingness means setting aside the scorecard. This step focuses on your part, not theirs.',
        ],
        reflectionPrompts: [
          'Which names on your list are hardest to become willing about? Why?',
          'How do you feel about setting aside the scorecard of wrongs done to you?',
        ],
        keyTakeaways: [
          'Willingness is an emotional preparation, not an immediate action.',
          'Strong emotions about certain names are normal and should be processed.',
          'Focus on your part, regardless of what others did.',
        ],
      },
      {
        id: 'step8-lesson3',
        lessonNumber: 3,
        title: 'Healing Begins with the List',
        estimatedMinutes: 10,
        contentBlocks: [
          'The act of writing the list is itself a step toward healing. It brings hidden guilt into consciousness where it can be addressed.',
          'Some people you harmed may no longer be in your life, or they may have passed away. They still belong on the list. There are ways to make amends even when direct contact is impossible.',
          'Completing this list with honesty and willingness prepares you for the transformative work of Step 9. You are building the bridge between regret and restoration.',
        ],
        reflectionPrompts: [
          'How does it feel to see all the names on your list in one place?',
          'What do you hope will come from making amends?',
        ],
        keyTakeaways: [
          'Writing the list brings hidden guilt into the light.',
          'Include people even if direct amends are not possible.',
          'The list is the bridge between regret and restoration.',
        ],
      },
    ],
  },
  {
    stepNumber: 9,
    title: 'Making Amends',
    tagline: 'Taking action to repair what we have broken',
    principle: 'Justice',
    description:
      'Made direct amends to such people wherever possible, except when to do so would injure them or others.',
    lessons: [
      {
        id: 'step9-lesson1',
        lessonNumber: 1,
        title: 'Direct Amends vs. Indirect Amends',
        estimatedMinutes: 14,
        contentBlocks: [
          'Direct amends means going to the person, acknowledging the harm, and doing what you can to make it right. This might include repaying money, having an honest conversation, or changing a behavior.',
          'Indirect amends are appropriate when direct contact would cause further harm. For example, if reaching out to an ex-partner would disrupt their healing, you might instead make a living amends by treating future relationships with honesty and respect.',
          'The key phrase is "except when to do so would injure them or others." Always consult with your sponsor or counselor before making amends to ensure your approach is helpful, not harmful.',
        ],
        reflectionPrompts: [
          'Which people on your list are appropriate for direct amends?',
          'For whom would indirect or living amends be more appropriate?',
        ],
        keyTakeaways: [
          'Direct amends involve face-to-face acknowledgment and restitution.',
          'Indirect amends apply when direct contact would cause harm.',
          'Always seek guidance before making amends.',
        ],
      },
      {
        id: 'step9-lesson2',
        lessonNumber: 2,
        title: 'How to Make Amends',
        estimatedMinutes: 12,
        contentBlocks: [
          'When making amends, be specific about what you did, take responsibility without excuses, and ask what you can do to make it right. Keep the focus on them, not on your guilt.',
          'Prepare for different reactions. Some people will be grateful. Others may be angry, dismissive, or unforgiving. Their reaction is not in your control; your sincerity is.',
          'Remember that amends are about changed behavior, not just words. An apology without changed behavior is manipulation. Show through your actions that you are different.',
        ],
        reflectionPrompts: [
          'How will you approach your first amends conversation?',
          'How will you handle it if someone does not accept your amends?',
        ],
        keyTakeaways: [
          'Be specific, take responsibility, and ask how to make it right.',
          'You cannot control the other person\'s reaction.',
          'Changed behavior is the most powerful form of amends.',
        ],
      },
      {
        id: 'step9-lesson3',
        lessonNumber: 3,
        title: 'Living Amends',
        estimatedMinutes: 10,
        contentBlocks: [
          'A living amends means consistently showing up differently from how you showed up before. It is the most lasting form of restitution.',
          'If you were absent as a parent, a living amends is being present now. If you were dishonest in business, a living amends is practicing transparency. Your daily choices become the amends.',
          'This step often brings unexpected healing. Relationships you thought were lost may be restored. And even when they are not, you gain freedom from guilt and the ability to move forward with integrity.',
        ],
        reflectionPrompts: [
          'What living amends can you begin making today?',
          'How has making amends affected your sense of self-worth?',
        ],
        keyTakeaways: [
          'Living amends are shown through consistent changed behavior.',
          'Daily choices become your ongoing amends.',
          'Freedom from guilt comes through sincere restitution.',
        ],
      },
    ],
  },
  {
    stepNumber: 10,
    title: 'Continued Inventory',
    tagline: 'Maintaining awareness through daily practice',
    principle: 'Perseverance',
    description:
      'Continued to take personal inventory and when we were wrong promptly admitted it.',
    lessons: [
      {
        id: 'step10-lesson1',
        lessonNumber: 1,
        title: 'Daily Self-Examination',
        estimatedMinutes: 12,
        contentBlocks: [
          'Step 10 takes the deep work of Step 4 and makes it a daily habit. Instead of letting resentments and fears accumulate, you address them as they arise.',
          'A daily inventory can be as simple as asking yourself each evening: What went well today? Where did I fall short? Do I owe anyone an amends?',
          'This practice prevents the buildup of emotional baggage that can lead to relapse. Think of it as daily hygiene for your recovery.',
        ],
        reflectionPrompts: [
          'What time of day works best for you to do a daily inventory?',
          'What areas of your life need the most ongoing attention?',
        ],
        keyTakeaways: [
          'Daily inventory prevents emotional buildup.',
          'Three simple questions can guide your nightly review.',
          'Consistency matters more than depth in daily practice.',
        ],
      },
      {
        id: 'step10-lesson2',
        lessonNumber: 2,
        title: 'Prompt Admission',
        estimatedMinutes: 10,
        contentBlocks: [
          'The word "promptly" is critical. When you realize you are wrong, admit it right away. Do not let pride, embarrassment, or fear delay you.',
          'Prompt admission keeps small issues from becoming big resentments. It builds trust with the people around you and demonstrates the integrity you are developing in recovery.',
          'This does not mean you need to be perfect. It means you correct course quickly. Think of it like driving: if you drift out of your lane, you adjust immediately rather than continuing into oncoming traffic.',
        ],
        reflectionPrompts: [
          'When was the last time you promptly admitted a mistake? How did it feel?',
          'What typically prevents you from admitting when you are wrong?',
        ],
        keyTakeaways: [
          'Promptness prevents small issues from growing.',
          'Quick admission builds trust with others.',
          'Correction, not perfection, is the goal.',
        ],
      },
      {
        id: 'step10-lesson3',
        lessonNumber: 3,
        title: 'Spot-Check Inventory',
        estimatedMinutes: 10,
        contentBlocks: [
          'In addition to a nightly review, practice "spot-check" inventories throughout the day. When you feel agitated, anxious, or tempted, pause and ask what is happening inside.',
          'Often, a quick internal check reveals a fear, resentment, or unmet need that you can address before it escalates. This is emotional intelligence in action.',
          'The more you practice this, the more natural it becomes. You develop an internal early warning system that helps you stay grounded in recovery.',
        ],
        reflectionPrompts: [
          'What emotional triggers tend to catch you off guard during the day?',
          'How could a spot-check inventory have changed a recent difficult situation?',
        ],
        keyTakeaways: [
          'Spot-check inventories catch problems before they escalate.',
          'Pausing when agitated reveals hidden fears and needs.',
          'Practice builds an internal early warning system.',
        ],
      },
    ],
  },
  {
    stepNumber: 11,
    title: 'Prayer & Meditation',
    tagline: 'Deepening our connection to something greater',
    principle: 'Spiritual Awareness',
    description:
      'Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.',
    lessons: [
      {
        id: 'step11-lesson1',
        lessonNumber: 1,
        title: 'Finding Your Spiritual Practice',
        estimatedMinutes: 14,
        contentBlocks: [
          'Spiritual practice looks different for everyone. It might be traditional prayer, mindfulness meditation, time in nature, yoga, journaling, or quiet contemplation. There is no single right way.',
          'The goal is conscious contact, which means intentionally connecting with something greater than yourself on a regular basis. This practice grounds you and provides perspective when life feels chaotic.',
          'If you are new to spiritual practice, start small. Five minutes of quiet breathing or grateful reflection each morning can be transformative over time.',
        ],
        reflectionPrompts: [
          'What spiritual practices have you tried, and which ones resonated with you?',
          'If you do not have a spiritual practice, what might you be willing to try?',
        ],
        keyTakeaways: [
          'Spiritual practice is personal and does not require religion.',
          'Conscious contact means intentional, regular connection.',
          'Starting with five minutes daily is enough.',
        ],
      },
      {
        id: 'step11-lesson2',
        lessonNumber: 2,
        title: 'Prayer as Communication',
        estimatedMinutes: 12,
        contentBlocks: [
          'Whether you pray to God, speak to the universe, or simply set intentions, prayer is a form of communication that moves your focus from self-will to guidance.',
          'The step specifically says to pray for knowledge of your Higher Power\'s will and the power to carry it out. This is different from praying for specific outcomes. It is about alignment, not acquisition.',
          'Many people in recovery use the Serenity Prayer as a daily anchor: "Grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference."',
        ],
        reflectionPrompts: [
          'What do you typically pray or ask for? How might you shift that toward seeking guidance?',
          'How does the Serenity Prayer apply to your current situation?',
        ],
        keyTakeaways: [
          'Prayer shifts focus from self-will to guidance.',
          'Pray for alignment, not specific outcomes.',
          'The Serenity Prayer is a powerful daily tool.',
        ],
      },
      {
        id: 'step11-lesson3',
        lessonNumber: 3,
        title: 'Meditation and Stillness',
        estimatedMinutes: 12,
        contentBlocks: [
          'Meditation is the practice of being still and listening. While prayer is talking, meditation is receiving. Both are essential for conscious contact.',
          'In early recovery, stillness can feel uncomfortable. Our minds race, and sitting with ourselves can surface difficult emotions. This is normal and part of the healing.',
          'Simple meditation techniques include focusing on your breath, doing a body scan, or using a guided meditation app. The technique matters less than the consistency of practice.',
        ],
        reflectionPrompts: [
          'What happens when you sit in silence for five minutes? What comes up?',
          'How might regular meditation support your recovery?',
        ],
        keyTakeaways: [
          'Meditation is receiving, while prayer is communicating.',
          'Discomfort in stillness is normal and part of healing.',
          'Consistency of practice matters more than technique.',
        ],
      },
    ],
  },
  {
    stepNumber: 12,
    title: 'Carrying the Message',
    tagline: 'Serving others from the strength of our own recovery',
    principle: 'Service',
    description:
      'Having had a spiritual awakening as the result of these Steps, we tried to carry this message to others and to practice these principles in all our affairs.',
    lessons: [
      {
        id: 'step12-lesson1',
        lessonNumber: 1,
        title: 'The Spiritual Awakening',
        estimatedMinutes: 14,
        contentBlocks: [
          'A spiritual awakening is not necessarily a dramatic event. For most people, it is a gradual shift in perspective, priorities, and way of living. You realize you are different from who you were when you started.',
          'Signs of awakening include: genuine concern for others, the ability to face difficulty without using, a sense of purpose, and gratitude for the life you are building.',
          'Take a moment to reflect on how far you have come. Compare your mindset, relationships, and daily habits to where you started. The change is the awakening.',
        ],
        reflectionPrompts: [
          'In what ways are you different today compared to when you started recovery?',
          'What does "spiritual awakening" mean to you personally?',
        ],
        keyTakeaways: [
          'Spiritual awakening is usually gradual, not dramatic.',
          'Changed perspective and priorities are signs of awakening.',
          'Recognizing your growth reinforces your commitment.',
        ],
      },
      {
        id: 'step12-lesson2',
        lessonNumber: 2,
        title: 'Carrying the Message',
        estimatedMinutes: 12,
        contentBlocks: [
          'Carrying the message means sharing your experience, strength, and hope with others who are still struggling. It does not mean preaching or giving unsolicited advice.',
          'The most powerful message is your own story, told honestly. When someone sees that you have been where they are and found a way out, it gives them hope.',
          'Service can take many forms: sponsoring someone, volunteering at a recovery center, sharing at a meeting, or simply being available when someone reaches out for help.',
        ],
        reflectionPrompts: [
          'How can you share your recovery story in a way that helps others?',
          'What forms of service feel most meaningful to you?',
        ],
        keyTakeaways: [
          'Carrying the message is sharing your story, not giving advice.',
          'Your honest experience is the most powerful tool you have.',
          'Service strengthens your own recovery.',
        ],
      },
      {
        id: 'step12-lesson3',
        lessonNumber: 3,
        title: 'Practicing Principles in All Affairs',
        estimatedMinutes: 12,
        contentBlocks: [
          'The final part of Step 12 asks you to practice recovery principles in every area of your life, not just in meetings or with other people in recovery.',
          'Honesty, humility, courage, willingness, and service apply to your workplace, your family, your finances, and your daily decisions. Recovery is not a compartment of your life; it is the foundation.',
          'This is a lifelong practice. There is no graduation from the principles. Each day offers new opportunities to live with integrity, compassion, and purpose.',
        ],
        reflectionPrompts: [
          'Which recovery principle is hardest for you to apply outside of recovery settings?',
          'How do you want to live your life going forward, based on what you have learned?',
        ],
        keyTakeaways: [
          'Recovery principles apply to every area of life.',
          'There is no graduation from living with integrity.',
          'Each day is a new opportunity to practice what you have learned.',
        ],
      },
      {
        id: 'step12-lesson4',
        lessonNumber: 4,
        title: 'Your Recovery Legacy',
        estimatedMinutes: 10,
        contentBlocks: [
          'You have completed a journey through the 12 steps. This is not the end; it is the beginning of a life guided by these principles.',
          'Your legacy in recovery is the impact you have on others. Every person you help, every honest conversation you have, and every day you choose recovery over relapse adds to that legacy.',
          'Continue working these steps. Revisit them regularly. Let them deepen your understanding of yourself and your connection to others. The steps are a lifelong companion on the road to freedom.',
        ],
        reflectionPrompts: [
          'What legacy do you want to leave in your recovery community?',
          'Write a letter to someone who is just beginning their recovery journey.',
        ],
        keyTakeaways: [
          'Completing the steps is a beginning, not an end.',
          'Your recovery impact is your legacy.',
          'Revisit the steps regularly for continued growth.',
        ],
      },
    ],
  },
] as const;

export function getStepContent(stepNumber: number): StepContent | undefined {
  return STEP_CONTENT.find((s) => s.stepNumber === stepNumber);
}

export function getAllStepContent(): readonly StepContent[] {
  return STEP_CONTENT;
}
