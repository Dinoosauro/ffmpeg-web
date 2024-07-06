<script>
    import { getLang } from "../../ts/LanguageAdapt";
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    import Card from "../UIElements/Card/Card.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import ConversionStatus from "./ConversionStatus.svelte";
</script>

<Card type={1} inDelay={600}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="cut" width={26}></AdaptiveAsset>
        <h3>{getLang("Trim content:")}</h3>
    </div>
    <select bind:value={ConversionOptions.trimOptions.id}>
        <option value={0}>{getLang("Don't trim content")}</option>
        <option value={1}>{getLang("Trim content (single timestamp)")}</option>
        <option value={2}
            >{getLang("Trim content (multiple timestamps)")}</option
        >
    </select><br />
    {#if ConversionOptions.trimOptions.id === 1}
        <br />
        <Card>
            <h4>{getLang("Single timestamp settings:")}</h4>
            <div class="flex hcenter" style="gap: 10px">
                <label
                    class="flex hcenter"
                    style="gap: 5px; flex-shrink: 1; width: 100%"
                    >{getLang("Start:")}
                    <input
                        type="text"
                        style="width: 100%;"
                        bind:value={ConversionOptions.trimOptions
                            .singleTimestamp[0]}
                    />
                </label>
                <label
                    class="flex hcenter"
                    style="gap: 5px; flex-shrink: 1; width: 100%"
                >
                    {getLang("End:")}
                    <input
                        type="text"
                        style="width: 100%;"
                        bind:value={ConversionOptions.trimOptions
                            .singleTimestamp[1]}
                    />
                </label>
            </div>
        </Card>
    {:else if ConversionOptions.trimOptions.id === 2}
        <br />
        <Card>
            <h4>{getLang("Multiple timestamps settings:")}</h4>
            <p>
                {getLang(
                    "Write the multiple timestamps, one for each line. Then, add a divider between the timestamp and the file title",
                )}
            </p>
            <label style="gap: 5px" class="flex hcenter">
                {getLang("Divider")}:
                <input
                    type="text"
                    style="background-color: var(--row);"
                    bind:value={ConversionOptions.trimOptions.multipleTimestamps
                        .divider}
                />
            </label><br />
            <Switch
                text={getLang("Timestamp at the left")}
                checked={ConversionOptions.trimOptions.multipleTimestamps
                    .timestampAtLeft}
                on:change={({ detail }) =>
                    (ConversionOptions.trimOptions.multipleTimestamps.timestampAtLeft =
                        detail)}
            ></Switch><br />
            <textarea
                bind:value={ConversionOptions.trimOptions.multipleTimestamps
                    .text}
                style="background-color: var(--row);"
            ></textarea><br /><br />
            <Switch
                text={getLang("Automatically add title and track metadata")}
                on:change={({ detail }) =>
                    (ConversionOptions.trimOptions.multipleTimestamps.smartMetadata =
                        detail)}
                checked={ConversionOptions.trimOptions.multipleTimestamps
                    .smartMetadata}
            ></Switch>
            {#if ConversionOptions.trimOptions.multipleTimestamps.smartMetadata}
                <br />
                <Card type={1}>
                    <label class="flex hcenter" style="gap: 5px">
                        {getLang("Start from track")}
                        <input
                            type="number"
                            bind:value={ConversionOptions.trimOptions
                                .multipleTimestamps.startFrom}
                        />
                    </label>
                </Card>
            {/if}
        </Card>
    {/if}
</Card>
