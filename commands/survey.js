const { SlashCommandBuilder } = require("@discordjs/builders");
const formatDistanceToNow = require("date-fns/formatDistanceToNow");
const { th } = require("date-fns/locale");
const {Constants} = require('discord.js');


module.exports = {
  data: new SlashCommandBuilder()
    .setName("survey")
    .setDescription("Send surveys")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("by-role")
        .setDescription("Send surveys by role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("name of the role")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("message").setDescription("message").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("by-date")
        .setDescription("Send surveys by date")
        .addStringOption((option) =>
          option.setName("message").setDescription("message").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("since")
            .setDescription("date in timestamp (milliseconds)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("till")
            .setDescription("date in timestamp (milliseconds)")
        )
    ),
  async execute(interaction) {
    const guild = await interaction.client.guilds.cache.get(
      interaction.guildId
    );
    let members = await guild.members.cache.map((member) => member);
    const message = interaction.options.getString("message").replace(/\\n|\\r\\n/g, '\n')
    if (interaction.options._subcommand === "by-role") {
      const role = interaction.options.getRole("role");
      if (role.name === "@everyone")
        members = members.filter(({ user }) => !user.bot)
      else
        members = members.filter(({ roles, user }) => (!user.bot && roles.cache.some((memberRole) => memberRole.name === role.name)))
    } 
    else {
      const since = interaction.options.getString("since");
      const till = interaction.options.getString("till");
      if (till) 
        members = members.filter(({ user, joinedTimestamp }) => (!user.bot && joinedTimestamp < till && joinedTimestamp > since))
      else 
        members = members.filter(({ user, joinedTimestamp }) => (!user.bot && joinedTimestamp > since))
    }
    processMessages(interaction, members, message)
    await interaction.reply({ content: "Surveys sent!", ephemeral: true });
  },
};


async function processMessages(interaction, members, message){
  let counter = 0;
  const closedDM = []
  const interval = setInterval(async () => {
    const { roles, id, user } = members[counter];
    const channel = interaction.client.channels.cache.get(interaction.channelId);
    const targetUser = await interaction.client.users.fetch(id);
    targetUser
      .send(message)
      .then(() =>
        console.log(
          `Message Sent to ${targetUser.username}#${targetUser.discriminator}`
        )
      )
      .catch((e) => {
        console.error(`Couldn't DM member ${user}`)
        closedDM.push(targetUser)
      });
    counter++;
    if (counter >= members.length) {
      clearInterval(interval);
      tagUsers(closedDM, channel, message)
    }
  }, 60000);
}

async function tagUsers(users, channel, message, messageSize=50){
  const thread = await channel.threads.create({
    name: `Survay thread`,
    autoArchiveDuration: 60,
    reason: `Needed a separate thread people with closed DMs`,
  });
  await thread.send(message)
  const interval = setInterval(async () => {
    if (users.length < 1)
      return clearInterval(interval);

    const message = users.splice(0, messageSize).map(t => `<@${t.id}>`).join(' ')
    await thread.send(message)
    console.log(
      `Message Sent to ${message}`
    )
  }, 60000)

}