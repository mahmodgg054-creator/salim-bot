const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits,
  Collection,
  Events,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
});

// ========== Variables ==========
const ticketTaken = new Set();
const ticketAdmins = new Map();
const processedMessages = new Set();
const broadcastCooldown = new Set();
const activeGiveaways = new Collection();
const ratingCooldown = new Set();
const tempVoiceChannels = new Map();

// ========== Admin Points ==========
const adminPoints = {};

// ========== Broadcast Types ==========
const BROADCAST_TYPES = {
  EVERYONE: 'Everyone',
  ONLINE: 'Online Members',
  OFFLINE: 'Offline Members'
};

// ========== Welcome Variables ==========
let welcomeChannelId = null;
let welcomeMessage = 'Welcome to the server {user}! Enjoy your time here';

// ========== Ticket Variables ==========
let ticketCategoryId = null;
let ratingChannelId = null;
let tempVoiceCategoryId = null;

// ========== Anti-Crash System ==========
setInterval(() => {
  if (client.user) {
    console.log('💓 7bash Heartbeat - Bot is alive');
  }
}, 60000);

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught Exception:', error);
});

// ========== Register Slash Commands ==========
const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('📋 Show all bot commands'),
  
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Open ticket menu'),
  
  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('🎫 Show ticket panel'),
  
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎁 Open giveaway menu'),
  
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('📢 Send announcement to a channel')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Channel to send announcement')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('title')
        .setDescription('Announcement title')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('content')
        .setDescription('Announcement content')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('📢 Open broadcast menu'),
  
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🗑️ Clear messages')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Number of messages to clear')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
  
  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Lock the channel'),
  
  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Unlock the channel'),
  
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Ban reason')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Kick a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to kick')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Kick reason')
        .setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('🎖️ Add role to a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to give role')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('Role to give')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('📉 Remove role from a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to remove role from')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('Role to remove')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('tempvoice')
    .setDescription('🔊 Create a temporary voice channel'),
  
  new SlashCommandBuilder()
    .setName('mypoints')
    .setDescription('📊 Show your points'),
  
  new SlashCommandBuilder()
    .setName('points')
    .setDescription('📊 Show member points')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to show points')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Show points leaderboard'),
  
  new SlashCommandBuilder()
    .setName('setwelcomechannel')
    .setDescription('👋 Set welcome channel')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Welcome channel')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('setwelcomemessage')
    .setDescription('📝 Set welcome message')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Welcome message (use {user} for username)')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('setticketcategory')
    .setDescription('📁 Set ticket category')
    .addChannelOption(option => 
      option.setName('category')
        .setDescription('Ticket category')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('setratingchannel')
    .setDescription('⭐ Set ratings channel')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Ratings channel')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('settempvoicecategory')
    .setDescription('🔊 Set temp voice category')
    .addChannelOption(option => 
      option.setName('category')
        .setDescription('Temp voice category')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Check bot latency')
];

const rest = new REST({ version: '10' }).setToken('MTQ4MzUwOTcyMzU0MTAxNjc3MQ.Glix5-.9hF3_gPZD2OBeu3uExkxEqXn0iPuXYZndLSFx4');

(async () => {
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands('1483509723541016771'),
      { body: commands.map(command => command.toJSON()) },
    );
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// ========== Ready Event ==========
client.once('ready', () => {
  console.log(`✅ 7bash is online as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
});

// ========== Welcome Handler ==========
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    if (!welcomeChannelId) return;
    
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    if (!welcomeChannel) return;

    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🤝 **Welcome!**')
      .setDescription(`
Welcome to the server! 💪

${welcomeMessage.replace('{user}', member.user.username)}

**We're glad to have you here!** 🌟
      `)
      .setColor('#FFA500')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setImage('https://i.imgur.com/4M7yB7N.gif')
      .addFields(
        { name: '📊 Member Count', value: `${member.guild.memberCount}`, inline: true },
        { name: '📅 Joined', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true }
      )
      .setFooter({ text: '7bash Welcome System', iconURL: member.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await welcomeChannel.send({ content: `👋 Welcome ${member.user.toString()}!`, embeds: [welcomeEmbed] });
    
  } catch (error) {
    console.error('Welcome error:', error);
  }
});

// ========== Temp Voice Handler ==========
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    if (newState.channel && newState.channel.name === 'Create Temp Voice') {
      if (!tempVoiceCategoryId) return;
      
      const channel = await newState.guild.channels.create({
        name: `Temp Voice ${newState.member.user.username}`,
        type: 2,
        parent: tempVoiceCategoryId,
        userLimit: 10,
        permissionOverwrites: [
          {
            id: newState.member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers]
          }
        ]
      });
      
      await newState.member.voice.setChannel(channel);
      tempVoiceChannels.set(channel.id, newState.member.id);
      
      const embed = new EmbedBuilder()
        .setTitle('🔊 **Temp Voice Created**')
        .setDescription(`
Your temporary voice channel has been created!
You have full control over this channel:
- Change name
- Set user limit
- Mute/kick members
        `)
        .setColor('#00ff88')
        .setTimestamp();
      
      await channel.send({ embeds: [embed] }).catch(() => {});
    }
    
    if (oldState.channel && tempVoiceChannels.has(oldState.channel.id)) {
      if (oldState.channel.members.size === 0) {
        await oldState.channel.delete().catch(() => {});
        tempVoiceChannels.delete(oldState.channel.id);
      }
    }
  } catch (error) {
    console.error('Temp voice error:', error);
  }
});

// ========== Interaction Handler ==========
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isCommand()) return;
    
    const { commandName, options, member, guild, channel, user } = interaction;

    // ========== Help Command ==========
    if (commandName === 'help') {
      const helpEmbed = new EmbedBuilder()
        .setTitle('📋 **7bash Commands**')
        .setDescription('All available bot commands:')
        .setColor('#00ff88')
        .addFields(
          { 
            name: '🎫 **Ticket System**', 
            value: 
            '`/ticket` - Open ticket menu\n' +
            '`/ticketpanel` - Show ticket panel\n' +
            '`/setticketcategory` - Set ticket category\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '🎁 **Giveaway System**', 
            value: 
            '`/giveaway` - Open giveaway menu\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '👋 **Welcome System**', 
            value: 
            '`/setwelcomechannel` - Set welcome channel\n' +
            '`/setwelcomemessage` - Set welcome message\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '📢 **Announcement System**', 
            value: 
            '`/announce` - Send announcement\n' +
            '`/broadcast` - Open broadcast menu\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '🔊 **Temp Voice System**', 
            value: 
            '`/tempvoice` - Create temp voice channel\n' +
            '`/settempvoicecategory` - Set temp voice category\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '🛠️ **Admin Commands**', 
            value: 
            '`/clear [amount]` - Clear messages\n' +
            '`/lock` - Lock channel\n' +
            '`/unlock` - Unlock channel\n' +
            '`/ban [user]` - Ban member\n' +
            '`/kick [user]` - Kick member\n' +
            '`/addrole [user] [role]` - Add role\n' +
            '`/removerole [user] [role]` - Remove role\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '📊 **Points System**', 
            value: 
            '`/leaderboard` - Show leaderboard\n' +
            '`/mypoints` - Show your points\n' +
            '`/points [user]` - Show member points\n' +
            '`/setratingchannel` - Set ratings channel\n' +
            '─────────────────',
            inline: false
          },
          { 
            name: '🛠️ **Other Commands**', 
            value: 
            '`/ping` - Check bot latency\n' +
            '`/help` - Show this menu',
            inline: false
          }
        )
        .setFooter({ text: '7bash System', iconURL: client.user.displayAvatarURL() })
        .setTimestamp()
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }));

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🎫 Ticket')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('quick_ticket')
            .setEmoji('🎫'),
          new ButtonBuilder()
            .setLabel('🏆 Leaderboard')
            .setStyle(ButtonStyle.Success)
            .setCustomId('quick_leaderboard')
            .setEmoji('🏆'),
          new ButtonBuilder()
            .setLabel('📊 My Points')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('quick_mypoints')
            .setEmoji('📊'),
          new ButtonBuilder()
            .setLabel('🎁 Giveaway')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('quick_giveaway')
            .setEmoji('🎁')
        );
      
      return interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true });
    }

    // ========== Ticket Command ==========
    if (commandName === 'ticket') {
      await createTicketMenu(channel, guild);
      return interaction.reply({ content: '✅ Ticket menu opened', ephemeral: true });
    }

    // ========== Ticket Panel Command ==========
    if (commandName === 'ticketpanel') {
      await createTicketPanel(channel, guild);
      return interaction.reply({ content: '✅ Ticket panel shown', ephemeral: true });
    }

    // ========== Giveaway Command ==========
    if (commandName === 'giveaway') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      await createGiveawayMenu(channel);
      return interaction.reply({ content: '✅ Giveaway menu opened', ephemeral: true });
    }

    // ========== Announce Command ==========
    if (commandName === 'announce') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      
      const targetChannel = options.getChannel('channel');
      const title = options.getString('title');
      const content = options.getString('content');

      const announceEmbed = new EmbedBuilder()
        .setTitle(`📢 **${title}**`)
        .setDescription(content)
        .setColor('#FF4500')
        .setAuthor({ 
          name: user.tag, 
          iconURL: user.displayAvatarURL({ dynamic: true }) 
        })
        .setFooter({ text: '7bash Announcements', iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      await targetChannel.send({ embeds: [announceEmbed] });
      return interaction.reply({ content: `✅ Announcement sent to ${targetChannel.toString()}`, ephemeral: true });
    }

    // ========== Broadcast Command ==========
    if (commandName === 'broadcast') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      await createBroadcastMenu(channel);
      return interaction.reply({ content: '✅ Broadcast menu opened', ephemeral: true });
    }

    // ========== Clear Command ==========
    if (commandName === 'clear') {
      if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ You need Manage Messages permission!', ephemeral: true });
      }
      
      const amount = options.getInteger('amount');
      
      await interaction.deferReply({ ephemeral: true });
      
      const messages = await channel.messages.fetch({ limit: amount });
      await channel.bulkDelete(messages, true);
      
      return interaction.editReply({ content: `✅ Deleted **${messages.size}** messages` });
    }

    // ========== Lock Command ==========
    if (commandName === 'lock') {
      if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: '❌ You need Manage Channels permission!', ephemeral: true });
      }
      
      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: false
      });
      
      return interaction.reply({ content: `🔒 Channel ${channel.toString()} locked` });
    }

    // ========== Unlock Command ==========
    if (commandName === 'unlock') {
      if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: '❌ You need Manage Channels permission!', ephemeral: true });
      }
      
      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: true
      });
      
      return interaction.reply({ content: `🔓 Channel ${channel.toString()} unlocked` });
    }

    // ========== Ban Command ==========
    if (commandName === 'ban') {
      if (!member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({ content: '❌ You need Ban Members permission!', ephemeral: true });
      }
      
      const target = options.getUser('user');
      const reason = options.getString('reason') || 'No reason provided';
      
      await guild.members.ban(target, { reason });
      
      return interaction.reply({ content: `✅ Banned ${target.tag}\nReason: ${reason}` });
    }

    // ========== Kick Command ==========
    if (commandName === 'kick') {
      if (!member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: '❌ You need Kick Members permission!', ephemeral: true });
      }
      
      const target = options.getUser('user');
      const reason = options.getString('reason') || 'No reason provided';
      const targetMember = await guild.members.fetch(target.id);
      
      await targetMember.kick(reason);
      
      return interaction.reply({ content: `✅ Kicked ${target.tag}\nReason: ${reason}` });
    }

    // ========== Add Role Command ==========
    if (commandName === 'addrole') {
      if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: '❌ You need Manage Roles permission!', ephemeral: true });
      }
      
      const target = options.getUser('user');
      const role = options.getRole('role');
      const targetMember = await guild.members.fetch(target.id);
      
      await targetMember.roles.add(role);
      
      return interaction.reply({ content: `✅ Added ${role.toString()} to ${target.tag}` });
    }

    // ========== Remove Role Command ==========
    if (commandName === 'removerole') {
      if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: '❌ You need Manage Roles permission!', ephemeral: true });
      }
      
      const target = options.getUser('user');
      const role = options.getRole('role');
      const targetMember = await guild.members.fetch(target.id);
      
      await targetMember.roles.remove(role);
      
      return interaction.reply({ content: `✅ Removed ${role.toString()} from ${target.tag}` });
    }

    // ========== Temp Voice Command ==========
    if (commandName === 'tempvoice') {
      if (!tempVoiceCategoryId) {
        return interaction.reply({ content: '❌ Temp voice category not set!\nUse `/settempvoicecategory` first', ephemeral: true });
      }
      
      if (!member.voice.channel) {
        return interaction.reply({ content: '❌ You must be in a voice channel first!', ephemeral: true });
      }
      
      const voiceChannel = await guild.channels.create({
        name: `Temp Voice ${user.username}`,
        type: 2,
        parent: tempVoiceCategoryId,
        userLimit: 10,
        permissionOverwrites: [
          {
            id: user.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers]
          }
        ]
      });
      
      await member.voice.setChannel(voiceChannel);
      tempVoiceChannels.set(voiceChannel.id, user.id);
      
      const embed = new EmbedBuilder()
        .setTitle('🔊 **Temp Voice Created**')
        .setDescription(`
Your temporary voice channel has been created!
You have full control over this channel:
- Change name
- Set user limit
- Mute/kick members
        `)
        .setColor('#00ff88')
        .setTimestamp();
      
      await voiceChannel.send({ embeds: [embed] });
      
      return interaction.reply({ content: `✅ Temp voice created: ${voiceChannel.toString()}`, ephemeral: true });
    }

    // ========== My Points Command ==========
    if (commandName === 'mypoints') {
      const points = adminPoints[user.id] || 0;
      const rank = getRank(points);
      
      const pointsEmbed = new EmbedBuilder()
        .setTitle('📊 **Your Points - 7bash**')
        .setDescription(`
👤 **User:** ${user}
⭐ **Points:** **${points}**
🏅 **Rank:** ${rank}
        `)
        .setColor('Gold')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: '7bash Points' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [pointsEmbed], ephemeral: true });
    }

    // ========== Points Command ==========
    if (commandName === 'points') {
      const target = options.getUser('user');
      const points = adminPoints[target.id] || 0;
      const rank = getRank(points);
      
      const pointsEmbed = new EmbedBuilder()
        .setTitle('📊 **Member Points - 7bash**')
        .setDescription(`
👤 **User:** ${target}
⭐ **Points:** **${points}**
🏅 **Rank:** ${rank}
        `)
        .setColor('Blue')
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: '7bash Points' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [pointsEmbed] });
    }

    // ========== Leaderboard Command ==========
    if (commandName === 'leaderboard') {
      await showLeaderboard(channel);
      return;
    }

    // ========== Set Welcome Channel Command ==========
    if (commandName === 'setwelcomechannel') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      
      const welcomeChannel = options.getChannel('channel');
      welcomeChannelId = welcomeChannel.id;
      
      return interaction.reply({ content: `✅ Welcome channel set to ${welcomeChannel.toString()}` });
    }

    // ========== Set Welcome Message Command ==========
    if (commandName === 'setwelcomemessage') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      
      const message = options.getString('message');
      welcomeMessage = message;
      
      return interaction.reply({ content: `✅ Welcome message set to:\n${message}` });
    }

    // ========== Set Ticket Category Command ==========
    if (commandName === 'setticketcategory') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      
      const category = options.getChannel('category');
      if (category.type !== 4) {
        return interaction.reply({ content: '❌ This is not a category!', ephemeral: true });
      }
      
      ticketCategoryId = category.id;
      
      return interaction.reply({ content: `✅ Ticket category set to ${category.toString()}` });
    }

    // ========== Set Rating Channel Command ==========
    if (commandName === 'setratingchannel') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      
      const ratingChannel = options.getChannel('channel');
      ratingChannelId = ratingChannel.id;
      
      return interaction.reply({ content: `✅ Ratings channel set to ${ratingChannel.toString()}` });
    }

    // ========== Set Temp Voice Category Command ==========
    if (commandName === 'settempvoicecategory') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only command!', ephemeral: true });
      }
      
      const category = options.getChannel('category');
      if (category.type !== 4) {
        return interaction.reply({ content: '❌ This is not a category!', ephemeral: true });
      }
      
      tempVoiceCategoryId = category.id;
      
      const createChannel = await guild.channels.create({
        name: 'Create Temp Voice',
        type: 2,
        parent: category.id
      });
      
      return interaction.reply({ content: `✅ Temp voice category set to ${category.toString()}\nCreated "Create Temp Voice" channel` });
    }

    // ========== Ping Command ==========
    if (commandName === 'ping') {
      const ping = Date.now() - interaction.createdTimestamp;
      return interaction.reply({ content: `🏓 Pong! **${ping}ms**` });
    }

  } catch (error) {
    console.error('Interaction error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ An error occurred in 7bash', ephemeral: true }).catch(() => {});
    }
  }
});

// ========== Rank Function ==========
function getRank(points) {
  if (points >= 100) return '👑 **Director**';
  if (points >= 50) return '💎 **Vice Director**';
  if (points >= 25) return '🥇 **Senior Admin**';
  if (points >= 10) return '🥈 **Admin**';
  if (points >= 5) return '🥉 **Moderator**';
  if (points >= 1) return '📌 **Trainee**';
  return '🆕 **New**';
}

// ========== Create Ticket Menu ==========
async function createTicketMenu(channel, guild) {
  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket-reason')
        .setPlaceholder('🔽 Select ticket reason')
        .addOptions([
          { label: '🛒 Trading', value: 'trading', emoji: '🛒' },
          { label: '❓ Question', value: 'question', emoji: '❓' },
          { label: '⚠️ Complaint', value: 'complaint', emoji: '⚠️' },
          { label: '💬 Other', value: 'other', emoji: '💬' }
        ])
    );

  const embed = new EmbedBuilder()
    .setTitle('🎫 **7bash - Ticket System**')
    .setDescription('Welcome to 7bash\n\n📌 Select ticket reason')
    .setColor('#00ff88')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: '7bash Support', iconURL: guild.iconURL({ dynamic: true }) })
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [row] });
}

// ========== Create Ticket Panel ==========
async function createTicketPanel(channel, guild) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('🎫 Open Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫'),
      new ButtonBuilder()
        .setCustomId('my_tickets')
        .setLabel('📋 My Tickets')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋')
    );

  const embed = new EmbedBuilder()
    .setTitle('🎫 **7bash - Ticket Panel**')
    .setDescription('Choose service')
    .setColor('#5865F2')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: '7bash System' })
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [row] });
}

// ========== Create Giveaway Menu ==========
async function createGiveawayMenu(channel) {
  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('giveaway-time')
        .setPlaceholder('⏱️ Select giveaway duration')
        .addOptions([
          { label: '5 minutes', value: '5', emoji: '⏱️' },
          { label: '10 minutes', value: '10', emoji: '⏱️' },
          { label: '30 minutes', value: '30', emoji: '⏱️' },
          { label: '1 hour', value: '60', emoji: '⏱️' },
          { label: '2 hours', value: '120', emoji: '⏱️' },
          { label: '6 hours', value: '360', emoji: '⏱️' },
          { label: '12 hours', value: '720', emoji: '⏱️' },
          { label: '24 hours', value: '1440', emoji: '⏱️' }
        ])
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('giveaway-winners')
        .setPlaceholder('👥 Select winners count')
        .addOptions([
          { label: '1 Winner', value: '1', emoji: '🥇' },
          { label: '2 Winners', value: '2', emoji: '🥈' },
          { label: '3 Winners', value: '3', emoji: '🥉' },
          { label: '5 Winners', value: '5', emoji: '🎁' },
          { label: '10 Winners', value: '10', emoji: '🎉' }
        ])
    );

  const embed = new EmbedBuilder()
    .setTitle('🎁 **7bash - Giveaway System**')
    .setDescription('Welcome to giveaway system\n\n📌 Select duration first\nThen select winners count')
    .setColor('#FF69B4')
    .setFooter({ text: '7bash Giveaway' })
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [row, row2] });
}

// ========== Create Broadcast Menu ==========
async function createBroadcastMenu(channel) {
  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('broadcast-select')
        .setPlaceholder('📢 Select broadcast type')
        .addOptions([
          { label: '👥 Everyone', value: 'everyone', emoji: '👥' },
          { label: '🟢 Online', value: 'online', emoji: '🟢' },
          { label: '⚫ Offline', value: 'offline', emoji: '⚫' }
        ])
    );

  const embed = new EmbedBuilder()
    .setTitle('📢 **7bash - Broadcast System**')
    .setDescription('Select broadcast type')
    .setColor('#FF4500')
    .setFooter({ text: '7bash Broadcast' })
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [row] });
}

// ========== Broadcast Handler ==========
async function handleDMBroadcast(message, type, content) {
  const statusMsg = await message.channel.send('🔄 **Preparing broadcast...**');
  
  try {
    await message.guild.members.fetch();
    
    let targetMembers;
    let typeName;
    
    if (type === BROADCAST_TYPES.EVERYONE) {
      targetMembers = message.guild.members.cache.filter(m => !m.user.bot);
      typeName = 'Everyone';
    } else if (type === BROADCAST_TYPES.ONLINE) {
      targetMembers = message.guild.members.cache.filter(m => !m.user.bot && m.presence?.status === 'online');
      typeName = 'Online Members';
    } else {
      targetMembers = message.guild.members.cache.filter(m => !m.user.bot && (!m.presence || m.presence.status === 'offline'));
      typeName = 'Offline Members';
    }
    
    if (targetMembers.size === 0) {
      return statusMsg.edit('❌ **No target members found!**');
    }
    
    await statusMsg.edit(`🔄 **Sending... 0/${targetMembers.size}**`);
    
    let success = 0, fail = 0, blocked = 0;
    const startTime = Date.now();
    
    const dmEmbed = new EmbedBuilder()
      .setTitle('📢 **Admin Message**')
      .setDescription(content)
      .setColor('#FF4500')
      .setAuthor({ 
        name: message.author.tag, 
        iconURL: message.author.displayAvatarURL({ dynamic: true }) 
      })
      .setFooter({ text: '7bash Broadcast', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();
    
    let count = 0;
    for (const member of targetMembers.values()) {
      try {
        await member.send({ 
          content: `👋 **Hello ${member.user.toString()}!**\n📨 New message from **7bash**:`,
          embeds: [dmEmbed] 
        });
        success++;
        count++;
        
        if (count % 5 === 0 || count === targetMembers.size) {
          await statusMsg.edit(`🔄 **Sending... ${count}/${targetMembers.size}**`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } catch (error) {
        if (error.code === 50007) blocked++;
        else if (error.code === 50013) fail++;
        else fail++;
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    const avgSpeed = (success / totalTime).toFixed(2);
    
    const reportEmbed = new EmbedBuilder()
      .setTitle('📊 **Broadcast Report**')
      .setDescription(`
**${typeName}**

📨 **Message:**
\`\`\`
${content.length > 100 ? content.substring(0, 100) + '...' : content}
\`\`\`

📈 **Statistics:**
\`\`\`diff
+ ✅ Success: ${success}/${targetMembers.size}
- ❌ Failed: ${fail}
- 🔒 DMs Closed: ${blocked}
\`\`\`

⚡ **Performance:**
\`\`\`yaml
Sender: ${message.author.tag}
Speed: ${avgSpeed} msg/sec
Time: ${formatTime(totalTime)}
Bot: ${client.user.tag}
\`\`\`

🏷️ **Type:** ${typeName}
      `)
      .setColor(success === targetMembers.size ? '#00ff00' : '#ff9900')
      .setFooter({ 
        text: `Broadcast by ${message.author.username} • 7bash`, 
        iconURL: message.author.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();

    reportEmbed.addFields({
      name: '🤖 **Bot Stats**',
      value: `\`\`\`fix\n${client.user.tag} : ${success} messages\n\`\`\``,
      inline: false
    });

    await statusMsg.edit({ content: '', embeds: [reportEmbed] });
    await message.channel.send(`✅ **Broadcast completed!** (${success}/${targetMembers.size})`);

  } catch (error) {
    console.error('Broadcast error:', error);
    await statusMsg.edit('❌ **Error during broadcast!**');
  }
}

// ========== Time Format Function ==========
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  if (mins > 0) return `${pad(mins)}:${pad(secs)}`;
  return `00:${pad(secs)}`;
}

// ========== Leaderboard Function ==========
async function showLeaderboard(channel) {
  const sorted = Object.entries(adminPoints).sort((a, b) => b[1] - a[1]);
  let desc = "";
  
  sorted.forEach(([id, pts], index) => {
    const medal = index === 0 ? '👑' : index === 1 ? '💎' : index === 2 ? '🥇' : '📌';
    const rank = getRank(pts);
    desc += `${medal} <@${id}> - **${pts}** points (${rank})\n`;
  });
  
  if (desc === "") desc = "📭 No points yet in 7bash";

  const lbEmbed = new EmbedBuilder()
    .setTitle("🏆 **7bash - Leaderboard**")
    .setDescription(desc)
    .setColor("Gold")
    .setFooter({ text: "7bash Points" })
    .setTimestamp();

  channel.send({ embeds: [lbEmbed] });
}

// ========== Send Rating Report ==========
async function sendRatingReport(guild, adminId, userId, rating, pointsChanged) {
  try {
    if (!ratingChannelId) return;
    
    const ratingChannel = guild.channels.cache.get(ratingChannelId);
    if (!ratingChannel) return;

    const admin = await client.users.fetch(adminId).catch(() => null);
    const user = await client.users.fetch(userId).catch(() => null);
    
    if (!admin || !user) return;

    let ratingText = '';
    if (rating === 5) ratingText = '⭐⭐⭐⭐⭐ Excellent';
    else if (rating === 4) ratingText = '⭐⭐⭐⭐ Very Good';
    else if (rating === 3) ratingText = '⭐⭐⭐ Average';
    else if (rating === 2) ratingText = '⭐⭐ Bad';
    else if (rating === 1) ratingText = '⭐ Very Bad';

    const reportEmbed = new EmbedBuilder()
      .setTitle('📊 **New Rating Report**')
      .setDescription(`
👤 **Admin:** ${admin.tag} (${admin})
👥 **User:** ${user.tag} (${user})
⭐ **Rating:** ${rating}/5 - ${ratingText}
📈 **Points Change:** ${pointsChanged > 0 ? '+' : ''}${pointsChanged}
🏅 **Current Points:** ${adminPoints[adminId] || 0}
🏆 **Rank:** ${getRank(adminPoints[adminId] || 0)}
      `)
      .setColor(pointsChanged > 0 ? '#00ff00' : pointsChanged < 0 ? '#ff0000' : '#ffff00')
      .setAuthor({ name: admin.tag, iconURL: admin.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: '7bash Rating System' })
      .setTimestamp();

    await ratingChannel.send({ embeds: [reportEmbed] });
    
  } catch (error) {
    console.error('Rating report error:', error);
  }
}

// ========== Start Giveaway Function ==========
async function startGiveaway(interaction, minutes, winners, prize) {
  const endTime = Date.now() + (minutes * 60 * 1000);
  
  const giveawayEmbed = new EmbedBuilder()
    .setTitle('🎁 **New Giveaway**')
    .setDescription(`
🎉 **Prize:** ${prize}
👥 **Winners:** ${winners}
⏱️ **Duration:** ${minutes} minutes
⌛ **Ends:** <t:${Math.floor(endTime / 1000)}:R>

Click 🎉 to enter
    `)
    .setColor('#FF69B4')
    .setFooter({ text: '7bash Giveaway' })
    .setTimestamp();

  const giveawayRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('enter_giveaway')
        .setLabel('Enter')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉')
    );

  const message = await interaction.channel.send({ embeds: [giveawayEmbed], components: [giveawayRow] });
  
  const entrants = new Set();
  
  const collector = message.createMessageComponentCollector({ 
    filter: i => i.customId === 'enter_giveaway',
    time: minutes * 60 * 1000 
  });

  collector.on('collect', async (i) => {
    entrants.add(i.user.id);
    await i.reply({ content: '✅ **You entered the giveaway!**', ephemeral: true });
  });

  collector.on('end', async () => {
    const entrantsArray = Array.from(entrants);
    
    if (entrantsArray.length === 0) {
      return message.reply('❌ **No participants in the giveaway**');
    }
    
    const winnersList = [];
    const tempArray = [...entrantsArray];
    
    for (let i = 0; i < Math.min(winners, entrantsArray.length); i++) {
      const randomIndex = Math.floor(Math.random() * tempArray.length);
      winnersList.push(tempArray[randomIndex]);
      tempArray.splice(randomIndex, 1);
    }
    
    const winnersText = winnersList.map(id => `<@${id}>`).join(', ');
    
    const resultEmbed = new EmbedBuilder()
      .setTitle('🎉 **Giveaway Ended**')
      .setDescription(`
🎁 **Prize:** ${prize}
👥 **Participants:** ${entrants.size}
🏆 **Winners:** ${winnersText}

Congratulations to the winners! Contact admins to claim your prize
      `)
      .setColor('#FFD700')
      .setFooter({ text: '7bash Giveaway' })
      .setTimestamp();

    await message.edit({ components: [] });
    await interaction.channel.send({ embeds: [resultEmbed] });
    
    for (const winnerId of winnersList) {
      const winner = await client.users.fetch(winnerId).catch(() => null);
      if (winner) {
        const winnerEmbed = new EmbedBuilder()
          .setTitle('🎉 **Congratulations! You Won the Giveaway!**')
          .setDescription(`
🎁 **Prize:** ${prize}
📢 **Giveaway Link:** ${message.url}

Contact admins to claim your prize
          `)
          .setColor('#FFD700')
          .setFooter({ text: '7bash Giveaway' });
        
        await winner.send({ embeds: [winnerEmbed] }).catch(() => {});
      }
    }
  });
}

// ========== Handle Ticket Creation ==========
async function handleTicketCreation(interaction) {
  const reason = interaction.isStringSelectMenu() ? interaction.values[0] : 'other';
  const guild = interaction.guild;
  const user = interaction.user;

  if (!ticketCategoryId) {
    return interaction.reply({ 
      content: '❌ Ticket category not set! Use `/setticketcategory` first', 
      ephemeral: true 
    });
  }

  const existing = guild.channels.cache.find(c => c.name && c.name.includes(user.id) && !c.name.includes('closed'));
  if (existing) {
    return interaction.reply({ 
      content: `📌 **You already have an open ticket!** ${existing.toString()} - 7bash`, 
      ephemeral: true 
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channelName = `7bash-${user.id}-${Date.now().toString().slice(-4)}`;
    
    const channel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: ticketCategoryId,
      permissionOverwrites: [
        { 
          id: guild.id, 
          deny: [PermissionFlagsBits.ViewChannel] 
        },
        { 
          id: user.id, 
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
        },
        { 
          id: client.user.id, 
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] 
        }
      ]
    });

    guild.roles.cache.forEach(role => {
      if (role.permissions.has(PermissionFlagsBits.Administrator)) {
        channel.permissionOverwrites.create(role, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        }).catch(() => {});
      }
    });

    let reasonText = reason === 'trading' ? '🛒 Trading' : 
                     reason === 'question' ? '❓ Question' : 
                     reason === 'complaint' ? '⚠️ Complaint' : '💬 Other';

    const embed = new EmbedBuilder()
      .setTitle(`🎫 7bash Ticket`)
      .setDescription(`
👤 **User:** ${user.tag}
📌 **Reason:** ${reasonText}
⏰ **Time:** <t:${Math.floor(Date.now()/1000)}:R>
      `)
      .setColor('#5865F2')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: '7bash Tickets', iconURL: guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('take_ticket')
          .setLabel('🎟️ Take')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('delete_ticket')
          .setLabel('🗑️ Delete')
          .setStyle(ButtonStyle.Danger)
      );

    await channel.send({ content: `${user}`, embeds: [embed], components: [row] });

    await interaction.editReply({ 
      content: `✅ **Ticket opened!** ${channel.toString()} - 7bash`,
      ephemeral: true 
    });

  } catch (error) {
    console.error('Ticket creation error:', error);
    await interaction.editReply({ content: '❌ Error in 7bash', ephemeral: true });
  }
}

// ========== Button & Menu Handler ==========
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'quick_ticket') {
        await createTicketMenu(interaction.channel, interaction.guild);
        return interaction.reply({ content: '✅ Ticket menu opened - 7bash', ephemeral: true });
      }
      
      if (interaction.customId === 'quick_leaderboard') {
        await showLeaderboard(interaction.channel);
        return interaction.reply({ content: '✅ Leaderboard shown - 7bash', ephemeral: true });
      }
      
      if (interaction.customId === 'quick_mypoints') {
        const points = adminPoints[interaction.user.id] || 0;
        const embed = new EmbedBuilder()
          .setTitle('📊 **Your Points - 7bash**')
          .setDescription(`⭐ **${points}** points\n🏅 ${getRank(points)}`)
          .setColor('Gold')
          .setFooter({ text: '7bash Points' });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (interaction.customId === 'quick_giveaway') {
        await createGiveawayMenu(interaction.channel);
        return interaction.reply({ content: '✅ Giveaway menu opened - 7bash', ephemeral: true });
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'giveaway-time') {
        if (!activeGiveaways.has(interaction.user.id)) {
          activeGiveaways.set(interaction.user.id, {});
        }
        const data = activeGiveaways.get(interaction.user.id);
        data.time = parseInt(interaction.values[0]);
        activeGiveaways.set(interaction.user.id, data);
        
        return interaction.reply({ content: `✅ Selected **${interaction.values[0]} minutes**, now choose winners`, ephemeral: true });
      }

      if (interaction.customId === 'giveaway-winners') {
        if (!activeGiveaways.has(interaction.user.id) || !activeGiveaways.get(interaction.user.id).time) {
          return interaction.reply({ content: '❌ Choose time first!', ephemeral: true });
        }

        const data = activeGiveaways.get(interaction.user.id);
        data.winners = parseInt(interaction.values[0]);
        
        await interaction.reply({ content: '✍️ **Send the prize name:**', ephemeral: true });
        
        const filter = (m) => m.author.id === interaction.user.id;
        
        try {
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
          const prize = collected.first().content;
          await collected.first().delete().catch(() => {});
          
          await startGiveaway(interaction, data.time, data.winners, prize);
          activeGiveaways.delete(interaction.user.id);
          
        } catch (error) {
          interaction.followUp({ content: '❌ **Time expired!**', ephemeral: true });
          activeGiveaways.delete(interaction.user.id);
        }
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket-reason') {
      await handleTicketCreation(interaction);
    }

    if (interaction.isButton() && interaction.customId === 'create_ticket') {
      await handleTicketCreation(interaction);
    }
    
    if (interaction.isButton() && interaction.customId === 'my_tickets') {
      const userTickets = interaction.guild.channels.cache.filter(
        c => c.name && c.name.includes(interaction.user.id)
      );
      
      if (userTickets.size === 0) {
        return interaction.reply({ content: '📭 **No tickets found - 7bash**', ephemeral: true });
      }
      
      let ticketsList = '';
      userTickets.forEach((channel) => {
        ticketsList += `${channel.toString()} - ${channel.name.includes('closed') ? '🔒' : '✅'}\n`;
      });
      
      const embed = new EmbedBuilder()
        .setTitle('📋 **Your Tickets - 7bash**')
        .setDescription(ticketsList)
        .setColor('Blue')
        .setFooter({ text: '7bash Tickets' });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'broadcast-select') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Admin only - 7bash', ephemeral: true });
      }
      
      await interaction.reply({ content: '✍️ **Send broadcast content:**', ephemeral: true });
      
      const filter = (m) => m.author.id === interaction.user.id;
      
      try {
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
        const content = collected.first().content;
        await collected.first().delete().catch(() => {});
        
        let typeName;
        if (interaction.values[0] === 'everyone') typeName = BROADCAST_TYPES.EVERYONE;
        else if (interaction.values[0] === 'online') typeName = BROADCAST_TYPES.ONLINE;
        else typeName = BROADCAST_TYPES.OFFLINE;
        
        const fakeMessage = {
          guild: interaction.guild,
          channel: interaction.channel,
          author: interaction.user,
          member: interaction.member
        };
        
        await handleDMBroadcast(fakeMessage, typeName, content);
        
      } catch (error) {
        await interaction.followUp({ content: '❌ **Time expired - 7bash**', ephemeral: true });
      }
    }

    if (interaction.isButton() && interaction.channel?.name && interaction.channel.name.includes('7bash')) {
      
      if (interaction.customId === 'take_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({ 
            content: '❌ Only admins can take tickets!', 
            ephemeral: true 
          });
        }
        
        const ticketId = interaction.channel.id;
        
        if (ticketTaken.has(ticketId)) {
          return interaction.reply({ 
            content: '⚠️ **Ticket already taken - 7bash**', 
            ephemeral: true 
          });
        }
        
        ticketTaken.add(ticketId);
        ticketAdmins.set(ticketId, interaction.user.id);
        
        await interaction.deferUpdate();
        
        if (!adminPoints[interaction.user.id]) adminPoints[interaction.user.id] = 0;
        adminPoints[interaction.user.id] += 1;
        
        await interaction.channel.send(`✅ **Taken by** ${interaction.user} - 7bash`);
        
        const disabledRow = ActionRowBuilder.from(interaction.message.components[0]);
        const takeButton = disabledRow.components.find(c => c.data.custom_id === 'take_ticket');
        if (takeButton) {
          takeButton.setDisabled(true);
          takeButton.setLabel('✅ Taken');
          takeButton.setStyle(ButtonStyle.Success);
        }
        
        await interaction.message.edit({ components: [disabledRow] }).catch(() => {});
      }

      if (interaction.customId === 'close_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({ content: "❌ Only admins can close tickets!", ephemeral: true });
        }
        
        await interaction.deferUpdate();
        
        await interaction.channel.setName(`${interaction.channel.name}-closed`).catch(() => {});
        
        const disabledRow = ActionRowBuilder.from(interaction.message.components[0]);
        disabledRow.components.forEach(button => {
          button.setDisabled(true);
        });
        
        await interaction.message.edit({ components: [disabledRow] }).catch(() => {});
        
        await interaction.channel.send(`🔒 **Closed by** ${interaction.user} - 7bash`);
        
        const channelNameParts = interaction.channel.name.split('-');
        const ticketCreatorId = channelNameParts[1];
        
        if (ticketCreatorId) {
          const ticketCreator = await client.users.fetch(ticketCreatorId).catch(() => null);
          
          if (ticketCreator) {
            const ratingEmbed = new EmbedBuilder()
              .setTitle('⭐ **Rate Support**')
              .setDescription('Thank you for using 7bash support\n\nRate your experience:')
              .setColor('#FFD700')
              .setFooter({ text: '7bash Rating System' })
              .setTimestamp();

            const ratingRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('rate_5')
                  .setLabel('⭐⭐⭐⭐⭐ Excellent')
                  .setStyle(ButtonStyle.Success)
                  .setEmoji('⭐'),
                new ButtonBuilder()
                  .setCustomId('rate_4')
                  .setLabel('⭐⭐⭐⭐ Very Good')
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji('⭐'),
                new ButtonBuilder()
                  .setCustomId('rate_3')
                  .setLabel('⭐⭐⭐ Average')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('⭐'),
                new ButtonBuilder()
                  .setCustomId('rate_2')
                  .setLabel('⭐⭐ Bad')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('⭐'),
                new ButtonBuilder()
                  .setCustomId('rate_1')
                  .setLabel('⭐ Very Bad')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('⭐')
              );

            await ticketCreator.send({ embeds: [ratingEmbed], components: [ratingRow] });
          }
        }
      }

      if (interaction.customId === 'delete_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({ content: "❌ Only admins can delete tickets!", ephemeral: true });
        }
        
        await interaction.deferUpdate();
        
        const confirmRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('confirm_delete')
              .setLabel('✅ Yes Delete')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('cancel_delete')
              .setLabel('❌ Cancel')
              .setStyle(ButtonStyle.Secondary)
          );
        
        await interaction.channel.send({ content: '⚠️ **Confirm ticket deletion - 7bash**', components: [confirmRow] });
      }
      
      if (interaction.customId === 'confirm_delete') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({ content: "❌ Only admins can delete tickets!", ephemeral: true });
        }
        
        await interaction.deferUpdate();
        await interaction.channel.send(`🗑️ **Deleting ticket - 7bash...**`);
        
        ticketTaken.delete(interaction.channel.id);
        ticketAdmins.delete(interaction.channel.id);
        
        setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
      }
      
      if (interaction.customId === 'cancel_delete') {
        await interaction.deferUpdate();
        await interaction.channel.send('❌ **Cancelled - 7bash**');
      }
    }

    if (interaction.isButton() && interaction.customId.startsWith('rate_')) {
      const rating = parseInt(interaction.customId.split('_')[1]);
      
      if (ratingCooldown.has(interaction.user.id)) {
        return interaction.reply({ content: '⏱️ **You rated recently, please wait**', ephemeral: true });
      }
      
      ratingCooldown.add(interaction.user.id);
      setTimeout(() => ratingCooldown.delete(interaction.user.id), 60000);
      
      let lastAdminId = null;
      let pointsChanged = 0;
      
      if (ticketAdmins.size > 0) {
        const lastTicket = Array.from(ticketAdmins.entries()).pop();
        lastAdminId = lastTicket[1];
      }
      
      if (lastAdminId) {
        if (!adminPoints[lastAdminId]) adminPoints[lastAdminId] = 0;
        
        if (rating === 5) {
          adminPoints[lastAdminId] += 2;
          pointsChanged = 2;
        } else if (rating === 4) {
          adminPoints[lastAdminId] += 1;
          pointsChanged = 1;
        } else if (rating === 3) {
          pointsChanged = 0;
        } else if (rating <= 2) {
          adminPoints[lastAdminId] -= 1;
          pointsChanged = -1;
        }
        
        const admin = await client.users.fetch(lastAdminId).catch(() => null);
        if (admin) {
          const ratingResultEmbed = new EmbedBuilder()
            .setTitle('📊 **Rating Result**')
            .setDescription(`
⭐ **Rating:** ${rating}/5
👤 **Rater:** ${interaction.user.tag}
📈 **Your Points:** ${adminPoints[lastAdminId]}
🏅 **Your Rank:** ${getRank(adminPoints[lastAdminId])}
            `)
            .setColor(rating >= 4 ? '#00ff00' : rating === 3 ? '#ffff00' : '#ff0000')
            .setFooter({ text: '7bash Rating System' })
            .setTimestamp();
          
          await admin.send({ embeds: [ratingResultEmbed] }).catch(() => {});
        }
        
        await sendRatingReport(interaction.guild, lastAdminId, interaction.user.id, rating, pointsChanged);
      }
      
      const thankEmbed = new EmbedBuilder()
        .setTitle('✅ **Thank You for Rating**')
        .setDescription(`You rated the service **${rating}/5** stars`)
        .setColor('#00ff00')
        .setFooter({ text: '7bash Rating System' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [thankEmbed], ephemeral: true });
    }

  } catch (error) {
    console.error('Interaction error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ An error occurred in 7bash', ephemeral: true }).catch(() => {});
    }
  }
});

// ✅ Bot Token
client.login(process.env.TOKEN);