const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'help',
    description: '📋 Show all bot commands',
  },
  {
    name: 'ticket',
    description: '🎫 Open ticket menu',
  },
  {
    name: 'ticketpanel',
    description: '🎫 Show ticket panel',
  },
  {
    name: 'giveaway',
    description: '🎁 Open giveaway menu',
  },
  {
    name: 'announce',
    description: '📢 Send announcement',
    options: [
      {
        name: 'channel',
        description: 'Channel to send announcement',
        type: 7,
        required: true,
      },
      {
        name: 'title',
        description: 'Announcement title',
        type: 3,
        required: true,
      },
      {
        name: 'content',
        description: 'Announcement content',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'broadcast',
    description: '📢 Open broadcast menu',
  },
  {
    name: 'clear',
    description: '🗑️ Clear messages',
    options: [
      {
        name: 'amount',
        description: 'Number of messages to clear',
        type: 4,
        required: true,
        min_value: 1,
        max_value: 100,
      },
    ],
  },
  {
    name: 'lock',
    description: '🔒 Lock the channel',
  },
  {
    name: 'unlock',
    description: '🔓 Unlock the channel',
  },
  {
    name: 'ban',
    description: '🔨 Ban a member',
    options: [
      {
        name: 'user',
        description: 'User to ban',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Ban reason',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'kick',
    description: '👢 Kick a member',
    options: [
      {
        name: 'user',
        description: 'User to kick',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Kick reason',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'addrole',
    description: '🎖️ Add role to a member',
    options: [
      {
        name: 'user',
        description: 'User to give role',
        type: 6,
        required: true,
      },
      {
        name: 'role',
        description: 'Role to give',
        type: 8,
        required: true,
      },
    ],
  },
  {
    name: 'removerole',
    description: '📉 Remove role from a member',
    options: [
      {
        name: 'user',
        description: 'User to remove role from',
        type: 6,
        required: true,
      },
      {
        name: 'role',
        description: 'Role to remove',
        type: 8,
        required: true,
      },
    ],
  },
  {
    name: 'tempvoice',
    description: '🔊 Create a temporary voice channel',
  },
  {
    name: 'mypoints',
    description: '📊 Show your points',
  },
  {
    name: 'points',
    description: '📊 Show member points',
    options: [
      {
        name: 'user',
        description: 'User to show points',
        type: 6,
        required: true,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: '🏆 Show points leaderboard',
  },
  {
    name: 'setwelcomechannel',
    description: '👋 Set welcome channel',
    options: [
      {
        name: 'channel',
        description: 'Welcome channel',
        type: 7,
        required: true,
      },
    ],
  },
  {
    name: 'setwelcomemessage',
    description: '📝 Set welcome message',
    options: [
      {
        name: 'message',
        description: 'Welcome message (use {user} for username)',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'setticketcategory',
    description: '📁 Set ticket category',
    options: [
      {
        name: 'category',
        description: 'Ticket category',
        type: 7,
        channel_types: [4],
        required: true,
      },
    ],
  },
  {
    name: 'setratingchannel',
    description: '⭐ Set ratings channel',
    options: [
      {
        name: 'channel',
        description: 'Ratings channel',
        type: 7,
        required: true,
      },
    ],
  },
  {
    name: 'settempvoicecategory',
    description: '🔊 Set temp voice category',
    options: [
      {
        name: 'category',
        description: 'Temp voice category',
        type: 7,
        channel_types: [4],
        required: true,
      },
    ],
  },
  {
    name: 'ping',
    description: '🏓 Check bot latency',
  },
];

const rest = new REST({ version: '10' }).setToken('MTQ4MzUwOTcyMzU0MTAxNjc3MQ.Glix5-.9hF3_gPZD2OBeu3uExkxEqXn0iPuXYZndLSFx4');

(async () => {
  try {
    console.log('🔄 بدء تسجيل أوامر السلاش...');
    
    // ✅ آيدي السيرفر بتاعك
    const guildId = '1470431118175109283';
    
    await rest.put(
      Routes.applicationGuildCommands('1483509723541016771', guildId),
      { body: commands }
    );
    
    console.log('✅ تم تسجيل أوامر السلاش بنجاح!');
    console.log('📌 الأوامر ظهرت دلوقتي في السيرفر');
    console.log('✨ اكتب / في الشات وهتشوف كل الأوامر');
  } catch (error) {
    console.error('❌ خطأ في تسجيل الأوامر:', error);
  }
})();